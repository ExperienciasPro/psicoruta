export interface StateVariable {
    id: string;
    name: string; // Ej. 'Presupuesto', 'Satisfacción', 'Estrés'
    currentValue: number;
    initialValue: number;
    minValue?: number; // Opcional, el trigger por defecto evaluará <= 0
    maxValue?: number; // Tope máximo opcional
    isCritical: boolean; // True -> llegar a un rango crítico desatará el fin prematuro de simulación (isFailedPrematurely)
}

export interface SimulationContext {
    variables: Record<string, StateVariable>; // Mapa normalizado en lugar de array para O(1)
    currentNodeId: string | null;
    history: string[]; // Registro de recorrido
    isFailedPrematurely: boolean; // Flag trigger global de fracaso
    failedVariableId?: string; // Cuál fue la variable crítica qué provocó el fin (opcional)
}
