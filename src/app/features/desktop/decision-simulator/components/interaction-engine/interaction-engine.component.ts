import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SimulationNode, SimulationEdge } from '../../models/decision-tree.model';

@Component({
    selector: 'app-interaction-engine',
    standalone: true,
    imports: [CommonModule, FormsModule, DragDropModule],
    templateUrl: './interaction-engine.component.html',
    styleUrls: ['./interaction-engine.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InteractionEngineComponent implements OnInit {
    // Input del nodo actual a jugar y posibles aristas de salida para derivar opciones
    @Input({ required: true }) node!: SimulationNode;
    @Input() availableEdges: SimulationEdge[] = [];

    // Output a transicionar basado en Edge ID (o emitir payload complejo si es requerido)
    @Output() transition = new EventEmitter<string>();

    // ============== STATE (Específico al tipo de pregrunta) ==============

    // Tipo inferido desde los metadatos o opciones (Para el MVP inferiremos basándonos en metadata manual si existe o aristas)
    interactionType = signal<'multiple' | 'ordenamiento' | 'distribucion'>('multiple');

    // Para Ordenamiento
    sortableItems = signal<{ id: string, label: string }[]>([]);

    // Para Distribución de Recursos
    maxResources = signal<number>(1000);
    resourceAllocations = signal<{ id: string, label: string, amount: number }[]>([]);

    // Feedback de recursos sobrantes (Computed reactivo sin ciclos de digest extra de Angular)
    allocatedSum = computed(() => this.resourceAllocations().reduce((sum, item) => sum + item.amount, 0));
    remainingResources = computed(() => this.maxResources() - this.allocatedSum());

    ngOnInit() {
        this.parseInteractionRules();
    }

    private parseInteractionRules() {
        // 1. Detección Inteligente del tipo de Input
        const metaType = this.node.metadata?.['interactionType'];

        if (metaType === 'ordenamiento') {
            this.interactionType.set('ordenamiento');
            // Mock Data: Extraída del contenido idealmente formatedo. Usaremos algo simple
            this.sortableItems.set([
                { id: 'opt_1', label: 'Priorizar Costos' },
                { id: 'opt_2', label: 'Proteger Marca' },
                { id: 'opt_3', label: 'Asegurar Empleados' }
            ]);
        }
        else if (metaType === 'distribucion') {
            this.interactionType.set('distribucion');
            this.maxResources.set(this.node.metadata?.['maxResources'] || 100);
            this.resourceAllocations.set([
                { id: 'r_mkt', label: 'Marketing', amount: 0 },
                { id: 'r_dev', label: 'Desarrollo', amount: 0 },
                { id: 'r_hr', label: 'Personal', amount: 0 }
            ]);
        }
        else {
            // Por Defecto: Dicotómicas / Múltiples leídas desde las Aristas Salientes
            this.interactionType.set('multiple');
            // Las opciones son esencialmente los Conditions de las aristas.
        }
    }

    // =================== HANDLERS ===================

    submitMultiple(edgeId: string) {
        this.transition.emit(edgeId);
    }

    // Drag and Drop (Ordenamiento táctil)
    onDrop(event: CdkDragDrop<{ id: string, label: string }[]>) {
        const list = [...this.sortableItems()];
        moveItemInArray(list, event.previousIndex, event.currentIndex);
        this.sortableItems.set(list);
    }

    submitSortable() {
        // Enviamos una decisión mock representativa o la primera arista genérica del banco (Lógica de negocio dependiente)
        if (this.availableEdges.length > 0) {
            this.transition.emit(this.availableEdges[0].id);
        }
    }

    // Distribución Segura (Validación Cross-Field en Tiempo Real)
    onSliderChange(itemId: string, evt: Event) {
        const newVal = parseInt((evt.target as HTMLInputElement).value, 10) || 0;

        this.resourceAllocations.update(items => {
            // ¿Cuánto suman los demás actualmente?
            const otherSum = items.filter(i => i.id !== itemId).reduce((sum, i) => sum + i.amount, 0);

            // El nuevo valor permitido está capado por (Max - SumaRestante)
            let allowedValue = newVal;
            if (otherSum + allowedValue > this.maxResources()) {
                allowedValue = this.maxResources() - otherSum;
            }

            return items.map(i => i.id === itemId ? { ...i, amount: allowedValue } : i);
        });
    }

    submitDistribution() {
        if (this.remainingResources() >= 0 && this.availableEdges.length > 0) {
            this.transition.emit(this.availableEdges[0].id);
        }
    }
}
