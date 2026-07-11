import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationNode } from '../../models/decision-tree.model';

@Component({
    selector: 'app-simulation-node',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './simulation-node.component.html',
    styleUrls: ['./simulation-node.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush, // Optimización crítica: Evita re-renders
})
export class SimulationNodeComponent {
    @Input({ required: true }) node!: SimulationNode;
    @Input() hasChildren = false;

    @Output() connectStart = new EventEmitter<MouseEvent>();
    @Output() connectEnd = new EventEmitter<void>();
    @Output() toggleCollapse = new EventEmitter<void>();
    @Output() deleteNode = new EventEmitter<void>();

    get isCollapsed(): boolean {
        return !!this.node.metadata?.['collapsed'];
    }
}
