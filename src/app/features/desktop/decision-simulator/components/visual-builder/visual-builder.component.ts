import { Component, ChangeDetectionStrategy, signal, computed, HostListener, ViewChild, ElementRef, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { SimulationNodeComponent } from '../simulation-node/simulation-node.component';
import { MetadataPanelComponent } from '../metadata-panel/metadata-panel.component';
import { SimulationNode, SimulationEdge } from '../../models/decision-tree.model';
import { Router } from '@angular/router';
import { SimulatorStorageService, SimulatorProject } from '../../services/simulator-storage.service';

@Component({
    selector: 'app-visual-builder',
    standalone: true,
    imports: [CommonModule, DragDropModule, SimulationNodeComponent, MetadataPanelComponent],
    templateUrl: './visual-builder.component.html',
    styleUrls: ['./visual-builder.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualBuilderComponent implements OnInit {
    @ViewChild('canvasWrapper') canvasWrapper!: ElementRef;

    @Input() initialTitle: string = '';
    @Input() initialContext: string = '';
    @Input() initialQuestion: string = '';
    @Input() initialNodes?: SimulationNode[];
    @Input() initialEdges?: SimulationEdge[];
    @Output() goBack = new EventEmitter<void>();

    // Estado reactivo (Signals)
    nodes = signal<SimulationNode[]>([]);
    edges = signal<SimulationEdge[]>([]);

    // Panning y Zoom
    viewportTransform = signal({ x: 0, y: 0, scale: 1 });

    // Conexión manual interactiva
    connectingFrom = signal<string | null>(null);
    mousePosition = signal({ x: 0, y: 0 });

    // Panning Engine (arrastre de lienzo)
    isPanning = signal<boolean>(false);
    lastPanPosition = signal({ x: 0, y: 0 });

    // Overlay / Fullscreen mode
    isFullscreen = signal<boolean>(false);

    // Selección y Metadatos
    selectedItemType = signal<'global' | 'node' | 'edge'>('global');
    selectedItemId = signal<string | null>(null);
    activeSidebarTab = signal<'tools' | 'config'>('tools');

    globalConfig = signal({
        complexity: 'Media',
        globalTimer: 600,
        feedbackMode: 'formativo'
    });

    // Template Bank State
    showTemplateBank = signal<boolean>(false);

    // Analytics State (Heatmaps)
    showAnalytics = signal<boolean>(false);

    // View Computing: Ramas Colapsables
    // Calculamos los nodos/aristas visibles en tiempo real sin mutar el Array original
    visibleNodes = computed(() => this.calculateVisibleNodes(this.nodes(), this.edges()));
    visibleEdges = computed(() => this.calculateVisibleEdges(this.edges(), this.visibleNodes()));

    ngOnInit() {
        if (this.initialNodes && this.initialNodes.length > 0) {
            this.nodes.set(this.initialNodes);
            this.edges.set(this.initialEdges || []);
        } else if (this.initialTitle || this.initialContext || this.initialQuestion) {
            // Inicializar con el nodo base usando los inputs
            this.nodes.set([
                {
                    id: 'n_init',
                    type: 'pregunta',
                    content: {
                        richText: `${this.initialContext || ''}`,
                        preguntaText: this.initialQuestion || ''
                    },
                    metadata: { x: 400, y: 100 }
                }
            ]);
            this.edges.set([]);
        } else {
            this.initMockData(); // Data mock inicial para demostración visual si no hay inputs
        }
    }

    constructor(private simulatorStorage: SimulatorStorageService, private router: Router) {
    }

    // ============== DRAG AND DROP ==============
    onNodeDragEnded(event: CdkDragEnd, node: SimulationNode) {
        const position = event.source.getFreeDragPosition();
        this.updateNodeMetadata(node.id, { x: position.x, y: position.y });
    }

    // ============== CREACIÓN Y GESTIÓN DE NODOS ==============
    addNode(nodeType: any = 'pregunta') {
        const newId = `n_${Date.now()}`;
        // Ubicamos el nuevo nodo basándonos en el offset visual actual
        const transform = this.viewportTransform();
        const spawnX = (100 - transform.x) / transform.scale;
        const spawnY = (100 - transform.y) / transform.scale;

        this.nodes.update(nodes => [...nodes, {
            id: newId,
            type: nodeType,
            content: nodeType === 'final'
                ? { richText: 'Descripción del resultado final...', resultado: 'Nuevo Final' }
                : { richText: 'Describe la situación inicial aquí...', preguntaText: 'Nueva Interacción...' },
            metadata: { x: spawnX, y: spawnY, collapsed: false, draggable: true, connectable: true }
        }]);
    }

    deleteNode(nodeId: string) {
        if (nodeId === 'n_init') return; // Bloqueo de seguridad para proteger Contexto Inicial

        // 1. Limpiar la selección activa
        if (this.selectedItemId() === nodeId) {
            this.selectedItemType.set('node');
            this.selectedItemId.set('n_init');
        }

        // 2. Si es la pregunta de apertura inicial conectada al input izquierdo, limpiar input
        if (nodeId === 'node-opening-question') {
            this.initialQuestion = '';
        }

        // 3. Eliminar Aristas (Edges) conectadas a este nodo
        this.edges.update(edges => edges.filter(e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId));

        // 4. Eliminar el Nodo del Store
        this.nodes.update(nodes => nodes.filter(n => n.id !== nodeId));
    }

    // ============== CREACIÓN DE ARISTAS ==============
    startConnection(event: MouseEvent, sourceNodeId: string) {
        event.stopPropagation();
        this.connectingFrom.set(sourceNodeId);
        this.mousePosition.set({ x: event.clientX, y: event.clientY });
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.connectingFrom()) {
            // Ajustamos el drag del mouse considerando el escalado por el zoom
            const transform = this.viewportTransform();
            const bounds = this.canvasWrapper.nativeElement.getBoundingClientRect();
            const x = (event.clientX - bounds.left - transform.x) / transform.scale;
            const y = (event.clientY - bounds.top - transform.y) / transform.scale;
            this.mousePosition.set({ x, y });
        } else if (this.isPanning()) {
            const dx = event.clientX - this.lastPanPosition().x;
            const dy = event.clientY - this.lastPanPosition().y;
            this.viewportTransform.update(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
            this.lastPanPosition.set({ x: event.clientX, y: event.clientY });
        }
    }

    @HostListener('document:mouseup')
    onMouseUp() {
        this.connectingFrom.set(null); // Cancelar si lo suelta en aire
        this.isPanning.set(false);
    }

    // ============== INTERACCIONES DEL LIENZO (PAN & ZOOM) ==============

    startPanCanvas(event: MouseEvent) {
        // Solo inicia pan si le damos clic directo al fondo, no a sus hijos
        if ((event.target as HTMLElement).classList.contains('canvas-grid') || (event.target as HTMLElement).classList.contains('edges-layer') || (event.target as HTMLElement).classList.contains('canvas-container')) {
            this.isPanning.set(true);
            this.lastPanPosition.set({ x: event.clientX, y: event.clientY });
            this.selectGlobal();
        }
    }

    onCanvasWheel(event: WheelEvent) {
        // Prevenir comportamiento nativo (scroll de página o zoom de navegador) si estamos dentro del lienzo
        event.preventDefault();

        if (event.ctrlKey || event.metaKey) {
            // Modo Zoom: Acercar/Alejar
            const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
            this.viewportTransform.update(t => {
                const newScale = Math.min(Math.max(0.2, t.scale + zoomDelta), 3);
                return { ...t, scale: newScale };
            });
        } else {
            // Modo Pan: Moverse con trackpad / scroll wheel suave
            this.viewportTransform.update(t => ({
                ...t,
                x: t.x - event.deltaX,
                y: t.y - event.deltaY
            }));
        }
    }

    toggleFullscreen() {
        this.isFullscreen.set(!this.isFullscreen());
    }

    zoomIn() {
        this.viewportTransform.update(t => {
            const newScale = Math.min(3, t.scale + 0.2);
            return { ...t, scale: newScale };
        });
    }

    zoomOut() {
        this.viewportTransform.update(t => {
            const newScale = Math.max(0.2, t.scale - 0.2);
            return { ...t, scale: newScale };
        });
    }

    fitView() {
        this.viewportTransform.set({ x: 0, y: 0, scale: 1 });
    }

    finishConnection(targetNodeId: string) {
        const sourceId = this.connectingFrom();
        if (sourceId && sourceId !== targetNodeId) {
            const newEdge: SimulationEdge = {
                id: `e_${Date.now()}`,
                sourceNodeId: sourceId,
                targetNodeId: targetNodeId,
                stateMutations: []
            };
            this.edges.update(edges => [...edges, newEdge]);
            this.selectEdge(null, newEdge.id); // Selecciona para editar inmediatamente
        }
        this.connectingFrom.set(null);
    }

    getDraftEdgePath(): string {
        const sourceId = this.connectingFrom();
        if (!sourceId) return '';
        const node = this.nodes().find(n => n.id === sourceId);
        if (!node) return '';
        const startX = (node.metadata?.['x'] || 0) + 120;
        const startY = (node.metadata?.['y'] || 0) + 150;
        const endX = this.mousePosition().x;
        const endY = this.mousePosition().y;
        return `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    // ============== AGRUPACIÓN (COLLAPSIBLE BRANCHES) ==============
    toggleCollapse(nodeId: string) {
        const node = this.nodes().find(n => n.id === nodeId);
        if (node) {
            const isCurrentlyCollapsed = !!node.metadata?.['collapsed'];
            this.updateNodeMetadata(nodeId, { collapsed: !isCurrentlyCollapsed });
        }
    }

    hasChildren(nodeId: string): boolean {
        return this.edges().some(e => e.sourceNodeId === nodeId);
    }

    // ============== SELECCIÓN Y METADATOS ==============

    selectGlobal() {
        this.selectedItemType.set('global');
        this.selectedItemId.set(null);
        this.activeSidebarTab.set('config');
    }

    selectNode(event: MouseEvent | null, nodeId: string) {
        if (event) event.stopPropagation();
        this.selectedItemType.set('node');
        this.selectedItemId.set(nodeId);
        this.activeSidebarTab.set('config');
    }

    selectEdge(event: MouseEvent | null, edgeId: string) {
        if (event) event.stopPropagation();
        this.selectedItemType.set('edge');
        this.selectedItemId.set(edgeId);
        this.activeSidebarTab.set('config');
    }

    getSelectedNode(): SimulationNode | null {
        if (this.selectedItemType() !== 'node') return null;
        return this.nodes().find(n => n.id === this.selectedItemId()) || null;
    }

    updateSelectedNodeContent(event: Event) {
        const newValue = (event.target as HTMLTextAreaElement).value;
        const selectedId = this.selectedItemId();
        if (!selectedId) return;

        this.nodes.update(nodes => nodes.map(n => {
            if (n.id === selectedId) {
                return {
                    ...n,
                    content: {
                        ...n.content,
                        preguntaText: n.type !== 'final' ? newValue : n.content.preguntaText,
                        resultado: n.type === 'final' ? newValue : n.content.resultado
                    }
                };
            }
            return n;
        }));
    }

    getSelectedEdge(): SimulationEdge | null {
        if (this.selectedItemType() !== 'edge') return null;
        return this.edges().find(e => e.id === this.selectedItemId()) || null;
    }

    updateInitialContext(event: Event) {
        const newValue = (event.target as HTMLTextAreaElement).value;
        this.initialContext = newValue;
        this.syncNodes();
    }

    updateInitialQuestion(event: Event) {
        const newValue = (event.target as HTMLInputElement).value;
        this.initialQuestion = newValue;
        this.syncNodes();
    }

    private syncNodes() {
        const rootId = 'n_init';
        const hasRootData = !!this.initialContext?.trim();
        const rootNodeObj = this.nodes().find(n => n.id === rootId);
        const rootExists = !!rootNodeObj;

        let rootNodeX = rootNodeObj?.metadata?.['x'] || 400;
        let rootNodeY = rootNodeObj?.metadata?.['y'] || 100;

        // 1. Manejo del Nodo Raíz
        if (!rootExists && hasRootData) {
            this.nodes.update(nodes => [...nodes, {
                id: rootId,
                type: 'pregunta',
                content: {
                    richText: `${this.initialContext || ''}`,
                    preguntaText: 'Contexto Inicial'
                },
                metadata: { x: rootNodeX, y: rootNodeY }
            }]);
        } else if (rootExists) {
            this.nodes.update(nodes => nodes.map(n => {
                if (n.id === rootId) {
                    return {
                        ...n,
                        content: {
                            ...n.content,
                            richText: `${this.initialContext || ''}`
                        }
                    };
                }
                return n;
            }));
        }

        // Si el usuario comenzó por la pregunta de apertura sin contexto inicial, 
        // asumimos la posición base de la raíz (400, 100)

        // 2. Manejo del Nodo Pregunta de Apertura
        const openingId = 'node-opening-question';
        const hasOpeningData = !!this.initialQuestion?.trim();
        const openingNodeObj = this.nodes().find(n => n.id === openingId);
        const openingExists = !!openingNodeObj;

        if (!openingExists && hasOpeningData) {
            this.nodes.update(nodes => [...nodes, {
                id: openingId,
                type: 'pregunta',
                content: {
                    richText: 'Ingresa detalles sobre esta pregunta o situación aquí...',
                    preguntaText: this.initialQuestion
                },
                metadata: { x: rootNodeX, y: rootNodeY + 180, draggable: true, connectable: true }
            }]);
        } else if (openingExists) {
            this.nodes.update(nodes => nodes.map(n => {
                if (n.id === openingId) {
                    return {
                        ...n,
                        content: {
                            ...n.content,
                            preguntaText: this.initialQuestion
                        }
                    };
                }
                return n;
            }));
        }

        // 3. Creación de la Conexión (Edge)
        if ((rootExists || hasRootData) && (openingExists || hasOpeningData)) {
            const edgeId = 'edge-root-to-opening';
            const edgeExists = this.edges().some(e => e.id === edgeId);
            if (!edgeExists) {
                this.edges.update(edges => [...edges, {
                    id: edgeId,
                    sourceNodeId: rootId,
                    targetNodeId: openingId,
                    selectionCondition: '',
                    stateMutations: []
                }]);
            }
        }
    }

    updateNode(updatedNode: SimulationNode) {
        this.nodes.update(nodes => nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
    }

    updateEdge(updatedEdge: SimulationEdge) {
        this.edges.update(edges => edges.map(e => e.id === updatedEdge.id ? updatedEdge : e));
    }

    updateGlobalConfig(config: any) {
        this.globalConfig.set(config);
    }

    handleAutoBranch(event: { nodeId: string, optionText: string }) {
        // Encontramos el nodo de origen
        const sourceNode = this.nodes().find(n => n.id === event.nodeId);

        // Calculamos una posición visual relativa
        const spawnX = sourceNode ? (sourceNode.metadata?.['x'] || 0) + 320 : 100;
        const spawnY = sourceNode ? (sourceNode.metadata?.['y'] || 0) + (Math.random() * 80) : 100;

        const newNodeId = `n_${Date.now()}`;

        // Descolapsamos para que la nueva rama se vea
        if (sourceNode) {
            this.updateNodeMetadata(event.nodeId, { collapsed: false });
        }

        // Creamos el nodo "vacío" o de continuación
        this.nodes.update(nodes => [...nodes, {
            id: newNodeId,
            type: 'pregunta',
            content: { richText: 'Describe la siguiente situación aquí...', preguntaText: 'Continuación: ' + event.optionText },
            metadata: { x: spawnX, y: spawnY, collapsed: false }
        }]);

        // Creamos la arista y conectamos la opción
        const newEdge: SimulationEdge = {
            id: `e_${Date.now()}`,
            sourceNodeId: event.nodeId,
            targetNodeId: newNodeId,
            selectionCondition: event.optionText,
            stateMutations: []
        };
        this.edges.update(edges => [...edges, newEdge]);
    }

    // ============== BANCO DE PLANTILLAS ==============

    toggleTemplateBank() {
        this.showTemplateBank.set(!this.showTemplateBank());
    }

    toggleAnalytics() {
        this.showAnalytics.set(!this.showAnalytics());
    }

    // Mock generador de métricas analíticas O(1) vía memorización visual
    getNodeAnalytics(nodeId: string) {
        if (!this.showAnalytics()) return null;
        // Mocking para MVP: Hash simple del ID para generar métricas fijas pero variadas
        const hash = nodeId.charCodeAt(nodeId.length - 1);
        if (hash % 2 === 0) return { avgTimeSecs: 45, isBottleneck: true };
        return { avgTimeSecs: 15, isBottleneck: false };
    }

    getEdgeAnalytics(edgeId: string) {
        if (!this.showAnalytics()) return null;
        const hash = edgeId.charCodeAt(edgeId.length - 1);
        if (hash % 3 === 0) return { failureRate: 85, isHighRisk: true }; // >80% Failure (High Risk)
        if (hash % 2 === 0) return { failureRate: 40, isHighRisk: false };
        return { failureRate: 5, isHighRisk: false };
    }

    loadTemplate(templateType: 'ventas' | 'etica' | 'crisis') {
        // Reemplazo limpio del lienzo (Reset total)
        this.selectGlobal();

        if (templateType === 'ventas') {
            this.nodes.set([
                { id: 't_v1', type: 'pregunta', content: { richText: 'Cliente exige 20% de descuento...' }, metadata: { x: 300, y: 100 } },
                { id: 't_v2', type: 'final', content: { richText: 'Pierdes margen pero cierras la venta' }, metadata: { x: 100, y: 300 } },
                { id: 't_v3', type: 'final', content: { richText: 'Pierdes el cliente por rigidez' }, metadata: { x: 500, y: 300 } }
            ]);
            this.edges.set([
                { id: 'e_v1', sourceNodeId: 't_v1', targetNodeId: 't_v2', selectionCondition: 'Aceptar_20', stateMutations: [{ variableId: 'v1', operation: 'subtract', value: 20 }] },
                { id: 'e_v2', sourceNodeId: 't_v1', targetNodeId: 't_v3', selectionCondition: 'Rechazar', stateMutations: [{ variableId: 'v2', operation: 'subtract', value: 50 }] }
            ]);
        } else {
            // Boilerplate genérico para demostrar
            this.initMockData();
        }

        this.showTemplateBank.set(false);
    }

    // ============== HELPERS / ALGORITMOS ==============
    private updateNodeMetadata(nodeId: string, partialMetadata: Record<string, any>) {
        this.nodes.update(nodes => nodes.map(n =>
            n.id === nodeId ? { ...n, metadata: { ...(n.metadata || {}), ...partialMetadata } } : n
        ));
    }

    private calculateVisibleNodes(allNodes: SimulationNode[], allEdges: SimulationEdge[]): SimulationNode[] {
        const visibleSet = new Set<string>();

        // Identificar raíces (nodos no referenciados como target)
        const targetIds = new Set(allEdges.map(e => e.targetNodeId));
        const roots = allNodes.filter(n => !targetIds.has(n.id));

        // Recorrido en profundidad DFS respetando el flag collapsed
        const traverse = (nodeId: string) => {
            visibleSet.add(nodeId);
            const node = allNodes.find(n => n.id === nodeId);
            if (node && !node.metadata?.['collapsed']) {
                const children = allEdges.filter(e => e.sourceNodeId === nodeId).map(e => e.targetNodeId);
                children.forEach(childId => traverse(childId));
            }
        };

        roots.forEach(r => traverse(r.id));

        // Si hay ciclos o nodos huérfanos sin padre que hayan quedado fuera. 
        // Para simplificar, añadiremos los que no formen parte de ramas colapsadas
        return allNodes.filter(n => visibleSet.has(n.id) || (!targetIds.has(n.id)));
    }

    private calculateVisibleEdges(allEdges: SimulationEdge[], visibleNodes: SimulationNode[]): SimulationEdge[] {
        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
        // Una arista se dibuja solo si su origen y destino están en el array de visibles
        return allEdges.filter(e => visibleNodeIds.has(e.sourceNodeId) && visibleNodeIds.has(e.targetNodeId));
    }

    // Helper para dibujar las conexiones SVG. Asume que cada nodo tiene su UI Width = 240, Height = approx 120
    getEdgePath(sourceId: string, targetId: string): string {
        const sourceNode = this.nodes().find(n => n.id === sourceId);
        const targetNode = this.nodes().find(n => n.id === targetId);
        if (!sourceNode || !targetNode || !sourceNode.metadata || !targetNode.metadata) return '';

        // Offset calculados basados en el SCSS
        const startX = (sourceNode.metadata['x'] || 0) + 120; // Mitad de width (240)
        const startY = (sourceNode.metadata['y'] || 0) + 150; // Inferior aproximado
        const endX = (targetNode.metadata['x'] || 0) + 120;
        const endY = (targetNode.metadata['y'] || 0) + 0;

        // Curva de bezier cúbica para efecto "flow"
        const curveDistance = Math.abs(endY - startY) * 0.5;
        return `M ${startX} ${startY} C ${startX} ${startY + curveDistance}, ${endX} ${endY - curveDistance}, ${endX} ${endY}`;
    }

    trackByNode(index: number, node: SimulationNode) {
        return node.id;
    }

    // Mock data hardcoded (vaciado)
    private initMockData() {
        this.nodes.set([]);
        this.edges.set([]);
    }

    publishSimulation() {
        if (confirm('¿Estás seguro de que deseas publicar este simulador?')) {
            this.isPanning.set(false);
            const project: SimulatorProject = {
                id: 'sim-' + Date.now().toString(36),
                nombre: this.initialTitle || 'Nuevo Simulador de Decisiones',
                descripcion: this.initialContext || 'Contexto inicial del simulador',
                estadoPublicacion: 'Publicado',
                themeColor: '#084983',
                configuracion_arbol: {
                    nodes: JSON.parse(JSON.stringify(this.nodes() || [])),
                    edges: JSON.parse(JSON.stringify(this.edges() || []))
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.simulatorStorage.save(project);
            alert('¡Simulador publicado exitosamente!');
            this.router.navigate(['/d/simulador']);
        }
    }

    /** Guardar progreso como borrador sin salir del constructor */
    guardarProgreso() {
        const project: SimulatorProject = {
            id: 'sim-' + Date.now().toString(36),
            nombre: this.initialTitle || 'Simulador en progreso',
            descripcion: this.initialContext || 'Contexto inicial del simulador',
            estadoPublicacion: 'Borrador',
            themeColor: '#B2AC88',
            configuracion_arbol: {
                nodes: JSON.parse(JSON.stringify(this.nodes() || [])),
                edges: JSON.parse(JSON.stringify(this.edges() || []))
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.simulatorStorage.save(project);
        alert('✅ Progreso guardado correctamente.');
    }
}
