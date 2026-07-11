export type SimulationNodeType = 'pregunta' | 'multimedia' | 'final' | 'decision-cajas' | 'decision-lista' | 'opciones';

export interface NodeOption {
    id?: string;
    texto: string;
}

export interface NodeContent {
    richText: string;
    preguntaText?: string;
    opciones?: NodeOption[];
    resultado?: string;
    puntajeObtenido?: number;
    urls?: string[]; // Para recursos multimedia como imágenes o videos
}

export interface SimulationNode {
    id: string;
    type: SimulationNodeType;
    content: NodeContent;
    localTimer?: number; // Temporizador local en segundos
    metadata?: Record<string, any>; // Metadatos adicionales para flexibilidad visual
}

export type MutationOperation = 'add' | 'subtract' | 'set';

export interface StateMutation {
    variableId: string;
    operation: MutationOperation;
    value: number; // Incremento, decremento, o valor absoluto
}

export interface SimulationEdge {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    selectionCondition?: string; // Por ejemplo, el ID de la opción seleccionada 
    stateMutations: StateMutation[]; // Payload que indica el impacto en estado oculto
}

export interface DecisionTree {
    nodes: SimulationNode[];
    edges: SimulationEdge[];
    startNodeId: string;
}
