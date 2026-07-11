import { DecisionTree, SimulationNode, SimulationEdge } from '../models/decision-tree.model';
import { StateVariable } from '../models/simulator-state.model';

export class SimulatorSchemaValidator {

    /**
     * Valida runtime si el objeto es un Nodo correcto sin anidaciones no reconocidas
     */
    static validateNode(node: any): node is SimulationNode {
        return (
            typeof node === 'object' && node !== null &&
            typeof node.id === 'string' &&
            ['pregunta', 'multimedia', 'final'].includes(node.type) &&
            typeof node.content === 'object' &&
            typeof node.content.richText === 'string'
        );
    }

    /**
     * Validaciones inyectadas de tipado paramétrico (Edges) 
     */
    static validateEdge(edge: any): edge is SimulationEdge {
        return (
            typeof edge === 'object' && edge !== null &&
            typeof edge.id === 'string' &&
            typeof edge.sourceNodeId === 'string' &&
            typeof edge.targetNodeId === 'string' &&
            Array.isArray(edge.stateMutations) &&
            edge.stateMutations.every((m: any) =>
                typeof m.variableId === 'string' &&
                ['add', 'subtract', 'set'].includes(m.operation) &&
                typeof m.value === 'number'
            )
        );
    }

    /**
     * Garantiza que la variable posea el umbral/flag crítico 
     */
    static validateStateVariable(variable: any): variable is StateVariable {
        return (
            typeof variable === 'object' && variable !== null &&
            typeof variable.id === 'string' &&
            typeof variable.name === 'string' &&
            typeof variable.currentValue === 'number' &&
            typeof variable.initialValue === 'number' &&
            typeof variable.isCritical === 'boolean'
        );
    }

    /**
     * Permite evaluar rápidamente si el JSON consumido desde Base de datos / Local Storage 
     * cumple con el protocolo lógico del árbol sin inyecciones del cliente
     */
    static validateTree(tree: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!tree || typeof tree !== 'object') {
            return { isValid: false, errors: ['Estructura de árbol general inválida o undefined'] };
        }

        if (!Array.isArray(tree.nodes) || !tree.nodes.every((n: any) => this.validateNode(n))) {
            errors.push('Estructura de nodos corrompida. Verifica payload de "type" o "content"');
        }

        if (!Array.isArray(tree.edges) || !tree.edges.every((e: any) => this.validateEdge(e))) {
            errors.push('Estructura de aristas o mutaciones inválida: operación de variables malformada');
        }

        if (typeof tree.startNodeId !== 'string') {
            errors.push('Debe definirse un id válido como root startNodeId');
        }

        return { isValid: errors.length === 0, errors };
    }
}
