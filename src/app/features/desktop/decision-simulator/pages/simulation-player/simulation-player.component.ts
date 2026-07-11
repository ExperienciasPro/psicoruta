import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { InteractionEngineComponent } from '../../components/interaction-engine/interaction-engine.component';
import { SimulatorStoreService } from '../../services/simulator-store.service';
import { SimulationNode, SimulationEdge } from '../../models/decision-tree.model';
import { Subscription, timer } from 'rxjs';

@Component({
    selector: 'app-simulation-player',
    standalone: true,
    imports: [CommonModule, InteractionEngineComponent],
    templateUrl: './simulation-player.component.html',
    styleUrls: ['./simulation-player.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export default class SimulationPlayerComponent implements OnInit, OnDestroy {
    private store = inject(SimulatorStoreService);
    private sanitizer = inject(DomSanitizer);

    // MOCK DATA (En producción esto vendría del Backend vía Resolve o HTTP Fetch)
    private mockNodes: SimulationNode[] = [
        { id: 'start', type: 'multimedia', content: { richText: '<h1>Crisis de Proveedores</h1><p>Nuestra planta en Asia reporta una interrupción del 60% por huelgas. Tienes 30 segundos para decidir la primera acción.</p>', urls: ['https://www.w3schools.com/html/mov_bbb.mp4'] }, metadata: { interactionType: 'multiple' } },
        { id: 'option1_result', type: 'pregunta', content: { richText: '<p>Aprobaste el sobrecosto. El envío llega pero afectas los márgenes. Ahora debes re-distribuir recortes presupuestarios.</p>' }, metadata: { interactionType: 'distribucion', maxResources: 50 } },
        { id: 'fail', type: 'final', content: { richText: '<h1>Directorio Insatisfecho</h1><p>Tus decisiones llevaron a una pérdida de reputación insostenible. Estás despedido.</p>' } }
    ];
    private mockEdges: SimulationEdge[] = [
        { id: 'e1', sourceNodeId: 'start', targetNodeId: 'option1_result', selectionCondition: 'Pagar flete aéreo urgente ($50k extra)', stateMutations: [{ variableId: 'budget', operation: 'subtract', value: 50 }] },
        { id: 'e2', sourceNodeId: 'start', targetNodeId: 'fail', selectionCondition: 'Esperar resolución local', stateMutations: [{ variableId: 'satisfaction', operation: 'subtract', value: 100 }] }
    ];

    // =============== LOCAL STATE ===============
    currentNode = signal<SimulationNode | null>(null);
    currentEdges = computed(() => this.mockEdges.filter(e => e.sourceNodeId === this.currentNode()?.id));

    // MODOS DE EJECUCIÓN (Fase 5)
    feedbackMode = signal<'formativo' | 'sumativo'>('formativo'); // Puede alterarse para el test de ambas lógicas
    formativeAlert = signal<{ title: string, message: string } | null>(null);

    // HUD 
    globalTimer = signal(120); // 2 minutos
    hudVariables = signal<{ label: string, value: number, warning: boolean, initialValue: number, max: number }[]>([]);
    isVideoLoading = signal(true);

    private sub: Subscription = new Subscription();
    private timerSub?: Subscription;

    // =============== PIPES COMPUTADOS ===============
    safeHtmlContent = computed(() => {
        const node = this.currentNode();
        return node ? this.sanitizer.bypassSecurityTrustHtml(node.content.richText) : '';
    });

    safeVideoUrl = computed(() => {
        const node = this.currentNode();
        if (node && node.type === 'multimedia' && node.content.urls?.length) {
            if (node.content.urls[0].endsWith('.mp4')) {
                return this.sanitizer.bypassSecurityTrustResourceUrl(node.content.urls[0]);
            }
        }
        return null;
    });

    ngOnInit() {
        // Inicializar Motor
        this.store.initSimulation([
            { id: 'budget', name: 'Presupuesto Inicial', currentValue: 200, initialValue: 200, isCritical: true, minValue: 0 },
            { id: 'satisfaction', name: 'Lealtad Cliente', currentValue: 100, initialValue: 100, isCritical: true, minValue: 0 }
        ], 'start');

        // Suscripción al Store Reactivo (Single Source of Truth)
        this.sub.add(
            this.store.state$.subscribe(state => {

                // 1. Fracaso por trigger automático
                if (state.isFailedPrematurely) {
                    this.currentNode.set(this.mockNodes.find(n => n.id === 'fail') || null); // Redireccionar a un nodo mock de Failure general
                } else {
                    // 2. Transición Normal
                    const newNode = this.mockNodes.find(n => n.id === state.currentNodeId) || null;
                    this.currentNode.set(newNode);
                    this.isVideoLoading.set(!!(newNode?.content.urls?.length)); // Reset loader
                }

                // Render HUD derivado y Preparar Datos Analíticos
                const derivedVars = Object.values(state.variables).map(v => ({
                    label: v.name,
                    value: v.currentValue,
                    initialValue: v.initialValue,
                    max: v.maxValue || Math.max(v.initialValue * 1.5, 200), // Usado para escalar las gráficas
                    warning: v.currentValue <= (v.initialValue * 0.25) // Warning UI if below 25%
                }));
                this.hudVariables.set(derivedVars);
            })
        );
        // Global Timer
        this.timerSub = timer(1000, 1000).subscribe(() => {
            this.globalTimer.update(t => {
                if (t <= 0) {
                    // Force Failure Timeout
                    this.timerSub?.unsubscribe();
                    return 0;
                }
                return t - 1;
            });
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
        this.timerSub?.unsubscribe();
    }

    // =============== HANDLERS ===============

    onVideoLoaded() {
        this.isVideoLoading.set(false);
    }

    handleTransition(edgeId: string) {
        const edge = this.mockEdges.find(e => e.id === edgeId);
        if (edge) {

            // LOGICA FORMATIVA
            if (this.feedbackMode() === 'formativo') {
                const negativeMutations = edge.stateMutations.some(m => m.operation === 'subtract' && m.value >= 25);
                if (negativeMutations || edge.targetNodeId === 'fail') {
                    // Pausa el flujo y advierte al usuario
                    this.formativeAlert.set({
                        title: edge.targetNodeId === 'fail' ? 'Consecuencia Fatal' : 'Análisis Formativo',
                        message: edge.targetNodeId === 'fail'
                            ? 'Esta decisión conlleva altos riesgos estructurales y resultaría en el fracaso del proyecto.'
                            : 'Esta opción consume valiosos recursos operativos. Considera otras alternativas más conservadoras.'
                    });
                    return;
                }
            }

            // LOGICA SUMATIVA Y TRANSICIONES NORMALES
            this.store.transitionToNode(edge.targetNodeId, edge.stateMutations);
        }
    }

    retryDecision() {
        this.formativeAlert.set(null); // Resetea la interrupción formativa para dejar intentar nuevamente
    }

    toggleMode() {
        // Helper temporal para cambiar modos al vuelo en demostración
        const newMode = this.feedbackMode() === 'formativo' ? 'sumativo' : 'formativo';
        this.feedbackMode.set(newMode);

        // Y reiniciamos puramente la simulación para evitar desajustes
        this.formativeAlert.set(null);
        this.store.initSimulation([
            { id: 'budget', name: 'Presupuesto Inicial', currentValue: 200, initialValue: 200, isCritical: true, minValue: 0 },
            { id: 'satisfaction', name: 'Lealtad Cliente', currentValue: 100, initialValue: 100, isCritical: true, minValue: 0 }
        ], 'start');
        this.globalTimer.set(120);
    }

    formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
}
