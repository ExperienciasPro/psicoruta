import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SimulationContext, StateVariable } from '../models/simulator-state.model';
import { StateMutation } from '../models/decision-tree.model';

@Injectable({
    providedIn: 'root'
})
export class SimulatorStoreService {
    /** 
     * Estado global de fallback inicial.
     */
    private readonly DEFAULT_STATE: SimulationContext = {
        variables: {},
        currentNodeId: null,
        history: [],
        isFailedPrematurely: false
    };

    // Usamos RxJS BehaviorSubject como reemplazo de Redux/Zustand optimizado para ecosistema Angular
    private stateSubject = new BehaviorSubject<SimulationContext>(this.DEFAULT_STATE);

    // Observable público para prevenir mutación accidental desde UI/Components
    public state$: Observable<SimulationContext> = this.stateSubject.asObservable();

    constructor() { }

    // ============================================
    // ACCIONES PURAS
    // ============================================

    /**
     * (Público) Inicializa el Estado con la configuración base
     * Normalizamos Variables (O(N) inicial, O(1) lecturas futuras)
     */
    public initSimulation(variables: StateVariable[], startNodeId: string): void {
        const variablesMap: Record<string, StateVariable> = {};

        variables.forEach(v => {
            // Clon y re-establecemos valores base por seguridad
            variablesMap[v.id] = { ...v, currentValue: v.initialValue };
        });

        this.stateSubject.next({
            variables: variablesMap,
            currentNodeId: startNodeId,
            history: [startNodeId],
            isFailedPrematurely: false,
            failedVariableId: undefined
        });
    }

    /**
     * (Público) Evalúa una transición, computando mutaciones
     */
    public transitionToNode(nextNodeId: string, mutations: StateMutation[] = []): void {
        const currentState = this.stateSubject.getValue();

        // Si caimos en un Failure Flag antes, ya no podemos movernos libremente. Prevención de vulnerabilidades en el estado.
        if (currentState.isFailedPrematurely) {
            return;
        }

        // 1. Mutar las Variables Inmutablemente basado en las mutaciones de la arista
        const nextVariables = this.applyMutations(currentState.variables, mutations);

        // 2. Trigger Event de Fracasos
        const failureTrigger = this.evaluatePrematureFailure(nextVariables);

        // 3. Implicaciones a nivel StateContext (Emit New Reference)
        this.stateSubject.next({
            ...currentState,
            variables: nextVariables,
            // Si fracasamos, el cursor de NextNodeId se pausa (o lo puedes manejar enviándolo a nodo Fail final)
            currentNodeId: failureTrigger.isFailed ? currentState.currentNodeId : nextNodeId,
            isFailedPrematurely: failureTrigger.isFailed,
            failedVariableId: failureTrigger.failedVariableId,
            history: failureTrigger.isFailed ? currentState.history : [...currentState.history, nextNodeId]
        });
    }

    // ============================================
    // LÓGICA INTERNA Y REDUCERS
    // ============================================

    private applyMutations(
        currentVariables: Record<string, StateVariable>,
        mutations: StateMutation[]
    ): Record<string, StateVariable> {
        const nextVars = { ...currentVariables }; // Clon superficial

        for (const mutation of mutations) {
            const variable = nextVars[mutation.variableId];
            if (!variable) continue; // Si no existe, se ignora por seguridad

            let nextValue = variable.currentValue;

            switch (mutation.operation) {
                case 'add':
                    nextValue += mutation.value;
                    break;
                case 'subtract':
                    nextValue -= mutation.value;
                    break;
                case 'set':
                    nextValue = mutation.value;
                    break;
            }

            // Prevención de desbordamiento (Min/Max Enforcements para no sobrepasar topes ni violar mínimos abruptos)
            const minValue = variable.minValue !== undefined ? variable.minValue : Number.MIN_SAFE_INTEGER;
            const maxValue = variable.maxValue !== undefined ? variable.maxValue : Number.MAX_SAFE_INTEGER;

            nextValue = Math.max(minValue, Math.min(nextValue, maxValue));

            nextVars[mutation.variableId] = {
                ...variable,
                currentValue: nextValue
            };
        }

        return nextVars;
    }

    private evaluatePrematureFailure(variables: Record<string, StateVariable>): { isFailed: boolean; failedVariableId?: string } {
        for (const varId in variables) {
            const variableContext = variables[varId];

            if (variableContext.isCritical) {
                const threshold = variableContext.minValue !== undefined ? variableContext.minValue : 0;

                // El trigger detecta variables <= 0 o <= threshold
                if (variableContext.currentValue <= threshold) {
                    return { isFailed: true, failedVariableId: variableContext.id };
                }
            }
        }
        return { isFailed: false };
    }
}
