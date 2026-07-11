import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VisualBuilderComponent } from '../components/visual-builder/visual-builder.component';
import { SimulatorStorageService, SimulatorProject } from '../services/simulator-storage.service';

@Component({
  selector: 'app-simulador-page',
  standalone: true,
  imports: [CommonModule, VisualBuilderComponent],
  template: `
    <!-- Vista Principal: Lista de Simuladores -->
    @if (!showBuilder()) {
      <div class="sim-page">
        <header class="sim-header">
          <div>
            <h1 class="sim-title">Simulador de Decisiones</h1>
            <p class="sim-subtitle">Crea escenarios interactivos de decisión para entrenamiento clínico</p>
          </div>
          <button class="sim-btn-create" (click)="startNewSimulator()">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nuevo Simulador
          </button>
        </header>

        @if (simulators().length === 0) {
          <div class="sim-empty">
            <div class="sim-empty-icon">🧠</div>
            <h3>Sin simuladores aún</h3>
            <p>Crea tu primer simulador de decisiones para entrenar escenarios clínicos interactivos.</p>
            <button class="sim-btn-create" (click)="startNewSimulator()">Crear Simulador</button>
          </div>
        } @else {
          <div class="sim-grid">
            @for (sim of simulators(); track sim.id) {
              <div class="sim-card" [class.draft]="sim.estadoPublicacion === 'Borrador'">
                <div class="sim-card-header">
                  <span class="sim-card-badge" [class.published]="sim.estadoPublicacion === 'Publicado'">
                    {{ sim.estadoPublicacion }}
                  </span>
                  <button class="sim-card-delete" (click)="deleteSimulator(sim.id); $event.stopPropagation()" title="Eliminar">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <h3 class="sim-card-title">{{ sim.nombre }}</h3>
                <p class="sim-card-desc">{{ sim.descripcion }}</p>
                <div class="sim-card-meta">
                  <span>{{ sim.configuracion_arbol.nodes.length }} nodos</span>
                  <span>{{ sim.updatedAt | date:'short' }}</span>
                </div>
                <button class="sim-card-edit" (click)="editSimulator(sim)">Editar</button>
              </div>
            }
          </div>
        }
      </div>
    }

    <!-- Vista Constructor -->
    @if (showBuilder()) {
      <div class="builder-fullscreen">
        <app-visual-builder
          [initialTitle]="editingTitle"
          [initialContext]="editingContext"
          [initialNodes]="editingNodes"
          [initialEdges]="editingEdges"
          (goBack)="closeBuilder()"
        ></app-visual-builder>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .sim-page {
      padding: 40px 48px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .sim-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .sim-title {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary, #1a1a2e);
      margin: 0 0 4px;
    }

    .sim-subtitle {
      font-size: 14px;
      color: var(--text-secondary, #64748b);
      margin: 0;
    }

    .sim-btn-create {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--accent-primary, #084983);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(178, 172, 136, 0.3);
    }

    .sim-btn-create:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(178, 172, 136, 0.4);
    }

    .sim-empty {
      text-align: center;
      padding: 80px 40px;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
    }

    .sim-empty-icon { font-size: 48px; margin-bottom: 16px; }
    .sim-empty h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary, #084983);
      margin: 0 0 8px;
    }
    .sim-empty p {
      color: var(--text-secondary, #64748b);
      font-size: 14px;
      margin: 0 0 24px;
    }

    .sim-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .sim-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
      transition: all 0.25s;
    }

    .sim-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.08);
    }

    .sim-card.draft { border-left: 3px solid #f59e0b; }

    .sim-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .sim-card-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #fef3c7;
      color: #92400e;
    }

    .sim-card-badge.published {
      background: #d1fae5;
      color: #065f46;
    }

    .sim-card-delete {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .sim-card-delete:hover { color: #ef4444; background: #fef2f2; }

    .sim-card-title {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary, #084983);
      margin: 0 0 8px;
    }

    .sim-card-desc {
      font-size: 13px;
      color: var(--text-secondary, #64748b);
      margin: 0 0 16px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .sim-card-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 16px;
    }

    .sim-card-edit {
      width: 100%;
      padding: 10px;
      background: var(--surface-secondary, #f8f6f1);
      color: var(--text-primary, #084983);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sim-card-edit:hover {
      background: var(--accent-primary, #084983);
      color: white;
    }

    .builder-fullscreen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: white;
    }
  `]
})
export class SimuladorPageComponent {
  private storage = inject(SimulatorStorageService);
  private router = inject(Router);

  showBuilder = signal(false);
  editingTitle = '';
  editingContext = '';
  editingNodes: any[] | undefined;
  editingEdges: any[] | undefined;

  simulators = computed(() => this.storage.getAll());

  startNewSimulator() {
    this.editingTitle = '';
    this.editingContext = '';
    this.editingNodes = undefined;
    this.editingEdges = undefined;
    this.showBuilder.set(true);
  }

  editSimulator(sim: SimulatorProject) {
    this.editingTitle = sim.nombre;
    this.editingContext = sim.descripcion;
    this.editingNodes = sim.configuracion_arbol.nodes;
    this.editingEdges = sim.configuracion_arbol.edges;
    this.showBuilder.set(true);
  }

  deleteSimulator(id: string) {
    if (confirm('¿Eliminar este simulador?')) {
      this.storage.delete(id);
    }
  }

  closeBuilder() {
    this.showBuilder.set(false);
  }
}
