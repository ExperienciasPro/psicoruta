import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SimulationNode, SimulationEdge, StateMutation } from '../../models/decision-tree.model';

@Component({
    selector: 'app-metadata-panel',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './metadata-panel.component.html',
    styleUrls: ['./metadata-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataPanelComponent {
    @Input() selectedType: 'global' | 'node' | 'edge' = 'global';

    // Usamos getters para mutar copias locales en el form y emitirlas 
    private _node: SimulationNode | null = null;
    @Input() set node(val: SimulationNode | null) {
        this._node = val ? JSON.parse(JSON.stringify(val)) : null; // Clonación profunda sencilla
    }
    get node(): SimulationNode | null { return this._node; }

    private _edge: SimulationEdge | null = null;
    @Input() set edge(val: SimulationEdge | null) {
        this._edge = val ? JSON.parse(JSON.stringify(val)) : null;
    }
    get edge(): SimulationEdge | null { return this._edge; }

    private _globalConfig: any;
    @Input() set globalConfig(val: any) {
        this._globalConfig = { ...val };
    }
    get globalConfig(): any { return this._globalConfig; }

    @Output() updateNode = new EventEmitter<SimulationNode>();
    @Output() updateEdge = new EventEmitter<SimulationEdge>();
    @Output() updateGlobal = new EventEmitter<any>();
    @Output() addOptionEvent = new EventEmitter<{ nodeId: string, optionText: string }>();

    newOptionText: string = '';
    newCompetencia: string = '';

    private sanitizer = inject(DomSanitizer);

    // SANITIZER DOMPurify (Mocked for conceptual strictness)
    sanitizeInput(rawHtml: string): string {
        if (!rawHtml) return '';
        // Aquí idealmente corres `DOMPurify.sanitize(rawHtml)`.
        return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    addCompetencia() {
        if (!this.newCompetencia.trim()) return;
        if (!this.globalConfig.competencias) {
            this.globalConfig.competencias = [];
        }
        if (!Array.isArray(this.globalConfig.competencias)) {
            this.globalConfig.competencias = [this.globalConfig.competencias];
        }
        this.globalConfig.competencias.push(this.newCompetencia.trim());
        this.newCompetencia = '';
        this.saveGlobal();
    }

    removeCompetencia(index: number) {
        if (this.globalConfig.competencias && Array.isArray(this.globalConfig.competencias)) {
            this.globalConfig.competencias.splice(index, 1);
            this.saveGlobal();
        }
    }

    saveGlobal() {
        this.updateGlobal.emit(this.globalConfig);
    }

    saveNode() {
        if (this._node) {
            this._node.content.richText = this.sanitizeInput(this._node.content.richText);
            this.updateNode.emit(this._node);
        }
    }

    addNewOption() {
        if (!this.newOptionText.trim() || !this._node) return;

        if (!this._node.content.opciones) {
            this._node.content.opciones = [];
        }

        const optionData = {
            id: 'opt_' + Date.now().toString(),
            texto: this.newOptionText.trim()
        };

        this._node.content.opciones.push(optionData);
        this.saveNode();

        this.addOptionEvent.emit({
            nodeId: this._node.id,
            optionText: optionData.texto
        });

        this.newOptionText = '';
    }

    removeOption(index: number) {
        if (this._node && this._node.content.opciones) {
            this._node.content.opciones.splice(index, 1);
            this.saveNode();
        }
    }

    saveEdge() {
        if (this._edge) {
            this.updateEdge.emit(this._edge);
        }
    }

    addMutationToEdge() {
        if (this._edge) {
            this._edge.stateMutations.push({ variableId: 'var_1', operation: 'add', value: 0 });
        }
    }

    removeMutation(index: number) {
        if (this._edge) {
            this._edge.stateMutations.splice(index, 1);
        }
    }
}
