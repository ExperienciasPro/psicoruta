import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage.service';
import { PersonalizationService } from '../../../core/services/personalization.service';
import { ClinicaService } from '../../../core/services/clinica.service';
import { CategoryService, TaskCategory } from '../../../core/services/category.service';
import { Patient } from '../../../core/models/clinica.model';

interface TaskStep {
  id: string;
  title: string;
  description: string;
  days: number;
  done: boolean;
}

interface TherapeuticTask {
  id: string;
  patientId: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  priority: 'alta' | 'media' | 'baja';
  difficulty: 'baja' | 'media' | 'alta';
  estimatedMinutes: number;
  progress: number;
  status: 'activa' | 'completada' | 'pausada';
  clientName: string;
  targetDate: string;
  createdAt: string;
  tags: string[];
  steps: TaskStep[];
  /** @deprecated migrated from old tasks */
  tasks?: TaskStep[];
  /** @deprecated migrated from old subGoals */
  subGoals?: { id: string; title: string; done: boolean }[];
}

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="goals-page">
      <header class="g-header">
        <div>
          <h1 class="g-title">Banco de Tareas Terapéuticas</h1>
          <p class="g-subtitle">Tareas clínicas reutilizables para tus {{ clientPlural() }}</p>
        </div>
        <div class="g-header-actions">
          <div class="g-view-toggle">
            <button [class.active]="viewMode() === 'lista'" (click)="viewMode.set('lista')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Lista
            </button>
            <button [class.active]="viewMode() === 'arbol'" (click)="viewMode.set('arbol')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
              Árbol
            </button>
          </div>
          <div class="g-stats">
            <div class="g-stat">
              <span class="g-stat-num">{{ activeGoals().length }}</span>
              <span class="g-stat-label">Activas</span>
            </div>
            <div class="g-stat">
              <span class="g-stat-num">{{ completedCount() }}</span>
              <span class="g-stat-label">Completadas</span>
            </div>
            <div class="g-stat">
              <span class="g-stat-num">{{ avgProgress() }}%</span>
              <span class="g-stat-label">Progreso</span>
            </div>
          </div>
          <button class="g-btn-new" (click)="openNew()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nueva Tarea
          </button>
        </div>
      </header>

      <!-- ═══ VISTA LISTA ═══ -->
      @if (viewMode() === 'lista') {
      <!-- Filter chips -->
      <div class="g-filters">
        <button class="g-filter-chip" [class.active]="filterCat() === 'all'" (click)="filterCat.set('all')">Todas</button>
        @for (cat of catService.categories(); track cat.id) {
          <button class="g-filter-chip" [class.active]="filterCat() === cat.id" (click)="filterCat.set(cat.id)">
            {{ cat.icon }} {{ cat.label }}
          </button>
        }
        <button class="g-filter-chip g-manage-cats-btn" (click)="showCatModal.set(true)" title="Gestionar categorías">
          ⚙️
        </button>
      </div>

      <!-- Goal cards -->
      <div class="g-grid">
        @for (goal of filteredGoals(); track goal.id) {
          <div class="g-card" (click)="editGoal(goal)">
            <div class="g-card-top">
              <span class="g-cat-badge" [style.background]="getCatColor(goal.category) + '18'" [style.color]="getCatColor(goal.category)">
                {{ getCatIcon(goal.category) }} {{ getCatLabel(goal.category) }}
              </span>
              <span class="g-priority" [class]="'priority-' + goal.priority">{{ goal.priority }}</span>
            </div>
            <h3 class="g-card-title">{{ goal.title }}</h3>
            <p class="g-card-client">{{ goal.clientName }}</p>
            <p class="g-card-desc">{{ goal.description }}</p>

            <!-- Tasks -->
            @if (goal.steps.length > 0) {
              <div class="g-tasks">
                @for (step of goal.steps.slice(0, 3); track step.id) {
                  <div class="g-task" [class.done]="step.done" (click)="toggleStep(goal, step); $event.stopPropagation()">
                    <span class="g-check">{{ step.done ? '✓' : '' }}</span>
                    <div class="g-task-info">
                      <span class="g-task-title">{{ step.title }}</span>
                      @if (step.days > 0) {
                        <span class="g-task-days">{{ step.days }} día{{ step.days > 1 ? 's' : '' }}</span>
                      }
                    </div>
                  </div>
                }
                @if (goal.steps.length > 3) {
                  <span class="g-more">+{{ goal.steps.length - 3 }} más</span>
                }
              </div>
            }

            <!-- Progress bar -->
            <div class="g-progress-wrap">
              <div class="g-progress-bar">
                <div class="g-progress-fill" [style.width.%]="goal.progress" [style.background]="getCatColor(goal.category)"></div>
              </div>
              <span class="g-progress-pct">{{ goal.progress }}%</span>
            </div>

            <div class="g-card-footer">
              <span class="g-date">📅 {{ goal.targetDate }}</span>
              <span class="g-status" [class]="'status-' + goal.status">{{ goal.status }}</span>
            </div>
          </div>
        }

        @if (filteredGoals().length === 0) {
          <div class="g-empty">
            <span class="g-empty-icon">📋</span>
            <h3>Sin tareas en esta categoría</h3>
            <p>Crea una tarea terapéutica reutilizable para tus {{ clientPlural() }}.</p>
            <button class="g-btn-new" (click)="openNew()">Crear Tarea</button>
          </div>
        }
      </div>
      }

      <!-- ═══ VISTA ÁRBOL ═══ -->
      @if (viewMode() === 'arbol') {
      <div class="t-legend-bar">
        @for (cat of catList(); track cat.label) {
          <span class="t-legend-item" [style.color]="cat.color">
            {{ cat.icon }} {{ cat.label }}
          </span>
        }
      </div>

      @if (treeClients().length === 0) {
        <div class="g-empty">
          <span class="g-empty-icon">🌳</span>
          <h3>Sin tareas registradas</h3>
          <p>Crea tareas terapéuticas para verlas aquí como un árbol interactivo agrupado por {{ clientPlural().toLowerCase() }}.</p>
          <button class="g-btn-new" (click)="openNew()">Crear Tarea</button>
        </div>
      }

      <div class="t-tree">
        @for (client of treeClients(); track client.name) {
          <div class="t-client-node">
            <div class="t-client-header">
              <div class="t-client-avatar">{{ client.name.charAt(0) }}</div>
              <div class="t-client-info">
                <span class="t-client-name">{{ client.name }}</span>
                <span class="t-client-stats">{{ client.goals.length }} tareas · {{ client.avgProgress }}% progreso</span>
              </div>
              <div class="t-client-bar">
                <div class="t-client-fill" [style.width.%]="client.avgProgress"></div>
              </div>
            </div>
            <div class="t-branches">
              @for (goal of client.goals; track goal.id) {
                <div class="t-goal-branch">
                  <div class="t-connector"></div>
                  <div class="t-goal-node" [style.border-left-color]="getCatColor(goal.category)">
                    <div class="t-goal-top">
                      <span class="t-goal-icon">{{ getCatIcon(goal.category) }}</span>
                      <span class="t-goal-title">{{ goal.title }}</span>
                      <span class="t-goal-pct" [style.color]="getCatColor(goal.category)">{{ goal.progress }}%</span>
                    </div>
                    <div class="t-goal-bar">
                      <div class="t-goal-fill" [style.width.%]="goal.progress" [style.background]="getCatColor(goal.category)"></div>
                    </div>
                    @if (goal.steps.length > 0) {
                      <div class="t-sub-branches">
                        @for (step of goal.steps; track step.id) {
                          <div class="t-sub-node" [class.done]="step.done">
                            <span class="t-sub-dot" [style.background]="step.done ? getCatColor(goal.category) : 'var(--border-default)'"></span>
                            <span>{{ step.title }}</span>
                            @if (step.days > 0) {
                              <span class="t-task-days">{{ step.days }}d</span>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="g-modal-bg" (click)="showModal.set(false)"></div>
        <div class="g-modal">
          <div class="g-modal-header">
            <h3>{{ editingId() ? 'Editar Tarea' : 'Nueva Tarea Terapéutica' }}</h3>
            <button class="g-modal-close" (click)="showModal.set(false)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="g-modal-body">
            <div class="g-field">
              <label>Título de la tarea</label>
              <input type="text" [(ngModel)]="form.title" placeholder="Ej: Ejercicio de respiración diafragmática">
            </div>
            <div class="g-field">
              <label>{{ clientSingular() }}</label>
              <div class="g-patient-selector">
                <div class="g-search-wrap">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text"
                    [(ngModel)]="patientSearchQuery"
                    (focus)="showPatientDrop = true"
                    (input)="showPatientDrop = true"
                    [placeholder]="form.patientId ? form.clientName : 'Buscar ' + clientSingular().toLowerCase() + '...'"
                    autocomplete="off">
                  @if (form.patientId) {
                    <button class="g-clear-btn" (click)="clearPatient(); $event.stopPropagation()">✕</button>
                  }
                </div>
                @if (showPatientDrop && filteredPatients().length > 0) {
                  <div class="g-patient-dropdown">
                    @for (p of filteredPatients(); track p.id) {
                      <div class="g-patient-option" (mousedown)="selectPatient(p)">
                        <div class="g-patient-avatar">{{ p.firstName?.charAt(0) }}{{ p.lastName?.charAt(0) }}</div>
                        <div class="g-patient-opt-info">
                          <span class="g-patient-opt-name">{{ p.firstName }} {{ p.lastName }}</span>
                          <span class="g-patient-opt-meta">{{ p.phone || p.email || 'Sin contacto' }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
                @if (showPatientDrop && filteredPatients().length === 0 && patientSearchQuery.length > 0) {
                  <div class="g-patient-dropdown">
                    <div class="g-patient-no-results">No se encontraron {{ clientPlural().toLowerCase() }}</div>
                  </div>
                }
              </div>
            </div>
            <div class="g-field">
              <label>Descripción</label>
              <textarea [(ngModel)]="form.description" rows="2" placeholder="¿Qué se busca lograr con esta tarea?"></textarea>
            </div>
            <div class="g-field">
              <label>Instrucciones</label>
              <textarea [(ngModel)]="form.instructions" rows="3" placeholder="Paso a paso para ejecutar la tarea..."></textarea>
            </div>
            <div class="g-field-row">
              <div class="g-field">
                <label>Categoría</label>
                <select [(ngModel)]="form.category">
                  @for (cat of catService.categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.icon }} {{ cat.label }}</option>
                  }
                </select>
              </div>
              <div class="g-field">
                <label>Prioridad</label>
                <select [(ngModel)]="form.priority">
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div class="g-field">
                <label>Dificultad</label>
                <select [(ngModel)]="form.difficulty">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
            <div class="g-field-row">
              <div class="g-field">
                <label>Tiempo estimado (min)</label>
                <input type="number" [(ngModel)]="form.estimatedMinutes" min="0" placeholder="30">
              </div>
            </div>
            <div class="g-field">
              <label>Etiquetas (separadas por coma)</label>
              <input type="text" [(ngModel)]="form.tagsInput" placeholder="ansiedad, respiración, relajación">
            </div>
            <div class="g-field">
              <label>Pasos</label>
              <div class="g-task-add-form">
                <div class="g-task-add-row">
                  <input type="text" [(ngModel)]="newTaskTitle" placeholder="Título del paso..." (keydown.enter)="addStep()" class="g-task-title-input">
                  <input type="number" [(ngModel)]="newTaskDays" placeholder="Días" min="0" class="g-task-days-input">
                  <button class="g-add-task" (click)="addStep()">+</button>
                </div>
                <input type="text" [(ngModel)]="newTaskDesc" placeholder="Descripción del paso (opcional)..." class="g-task-desc-input">
              </div>
              @for (step of form.steps; track step.id) {
                <div class="g-task-item">
                  <div class="g-task-item-info">
                    <span class="g-task-item-title">{{ step.title }}</span>
                    @if (step.description) {
                      <span class="g-task-item-desc">{{ step.description }}</span>
                    }
                    @if (step.days > 0) {
                      <span class="g-task-item-days">📅 {{ step.days }} día{{ step.days > 1 ? 's' : '' }}</span>
                    }
                  </div>
                  <button class="g-remove-task" (click)="removeStep(step.id)">×</button>
                </div>
              }
            </div>
          </div>
          <div class="g-modal-footer">
            @if (editingId()) {
              <button class="g-btn-delete" (click)="deleteTask()">Eliminar</button>
            }
            <div style="flex:1"></div>
            <button class="g-btn-cancel" (click)="showModal.set(false)">Cancelar</button>
            <button class="g-btn-save" (click)="saveTask()" [disabled]="!form.title.trim()">Guardar</button>
          </div>
        </div>
      }

      <!-- ═══ MODAL CATEGORÍAS ═══ -->
      @if (showCatModal()) {
        <div class="g-modal-bg" (click)="showCatModal.set(false)"></div>
        <div class="g-modal g-cat-modal">
          <div class="g-modal-header">
            <h3>Gestionar Categorías</h3>
            <button class="g-modal-close" (click)="showCatModal.set(false)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="g-modal-body">
            <div class="g-cat-list">
              @for (cat of catService.categories(); track cat.id; let i = $index) {
                <div class="g-cat-row">
                  @if (editingCatId() === cat.id) {
                    <input class="g-cat-icon-input" [(ngModel)]="editCatIcon" maxlength="2" />
                    <input class="g-cat-label-input" [(ngModel)]="editCatLabel" placeholder="Nombre" />
                    <input class="g-cat-color-input" type="color" [(ngModel)]="editCatColor" />
                    <button class="g-cat-action-btn save" (click)="saveCatEdit(cat.id)" title="Guardar">✓</button>
                    <button class="g-cat-action-btn cancel" (click)="editingCatId.set(null)" title="Cancelar">✕</button>
                  } @else {
                    <span class="g-cat-icon">{{ cat.icon }}</span>
                    <span class="g-cat-name" [style.border-left-color]="cat.color">{{ cat.label }}</span>
                    <span class="g-cat-color-dot" [style.background]="cat.color"></span>
                    <button class="g-cat-action-btn edit" (click)="startEditCat(cat)" title="Editar">✏️</button>
                    <button class="g-cat-action-btn delete" (click)="deleteCat(cat.id)" title="Eliminar">🗑️</button>
                  }
                </div>
              }
            </div>
            <div class="g-cat-new-row">
              <input class="g-cat-icon-input" [(ngModel)]="newCatIcon" maxlength="2" placeholder="📎" />
              <input class="g-cat-label-input" [(ngModel)]="newCatLabel" placeholder="Nueva categoría..." (keydown.enter)="addCategory()" />
              <input class="g-cat-color-input" type="color" [(ngModel)]="newCatColor" />
              <button class="g-cat-add-btn" (click)="addCategory()" [disabled]="!newCatLabel.trim()">+ Añadir</button>
            </div>
          </div>
          <div class="g-modal-footer">
            <button class="g-btn-cancel" (click)="catService.resetDefaults(); showCatModal.set(false)">Restaurar por defecto</button>
            <div style="flex:1"></div>
            <button class="g-btn-save" (click)="showCatModal.set(false)">Listo</button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './goals.component.scss'
})
export class GoalsComponent {
  private storage = inject(StorageService);
  private pz = inject(PersonalizationService);
  private clinicaService = inject(ClinicaService);
  catService = inject(CategoryService);
  private readonly KEY = 'pd_goals';

  clientSingular = this.pz.clientSingular;
  clientPlural = this.pz.clientPlural;

  tasks = signal<TherapeuticTask[]>(this.load());
  showModal = signal(false);
  showCatModal = signal(false);
  editingId = signal<string | null>(null);
  editingCatId = signal<string | null>(null);
  viewMode = signal<'lista' | 'arbol'>('lista');
  filterCat = signal('all');
  newTaskTitle = '';
  newTaskDesc = '';
  newTaskDays: number = 0;
  patientSearchQuery = '';
  showPatientDrop = false;

  // Category editing fields
  editCatLabel = '';
  editCatIcon = '';
  editCatColor = '#084983';
  newCatLabel = '';
  newCatIcon = '📎';
  newCatColor = '#084983';

  catList = computed(() => this.catService.categories().map(c => ({ label: c.label, color: c.color, icon: c.icon })));

  form: any = this.freshForm();

  filteredPatients = computed(() => {
    const q = this.patientSearchQuery.toLowerCase().trim();
    const all = this.clinicaService.activePatients();
    if (!q) return all;
    return all.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  activeGoals = computed(() => this.tasks().filter(g => g.status === 'activa'));
  completedCount = computed(() => this.tasks().filter(g => g.status === 'completada').length);
  avgProgress = computed(() => {
    const active = this.activeGoals();
    if (!active.length) return 0;
    return Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length);
  });

  filteredGoals = computed(() => {
    const cat = this.filterCat();
    const all = this.tasks();
    return cat === 'all' ? all : all.filter(g => g.category === cat);
  });

  treeClients = computed(() => {
    const map = new Map<string, TherapeuticTask[]>();
    for (const g of this.tasks()) {
      let name = g.clientName || 'Sin asignar';
      if (g.patientId) {
        const patient = this.clinicaService.getPatient(g.patientId);
        if (patient) name = `${patient.firstName} ${patient.lastName}`;
      }
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(g);
    }
    return Array.from(map.entries()).map(([name, goals]) => ({
      name,
      goals,
      avgProgress: Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    }));
  });

  getCatColor(id: string) { return this.catService.getColor(id); }
  getCatIcon(id: string) { return this.catService.getIcon(id); }
  getCatLabel(id: string) { return this.catService.getLabel(id); }

  // ── Category Management ────────────────
  startEditCat(cat: TaskCategory): void {
    this.editingCatId.set(cat.id);
    this.editCatLabel = cat.label;
    this.editCatIcon = cat.icon;
    this.editCatColor = cat.color;
  }

  saveCatEdit(id: string): void {
    if (!this.editCatLabel.trim()) return;
    this.catService.update(id, { label: this.editCatLabel.trim(), icon: this.editCatIcon || '📌', color: this.editCatColor });
    this.editingCatId.set(null);
  }

  deleteCat(id: string): void {
    const tasksUsing = this.tasks().filter(t => t.category === id).length;
    const msg = tasksUsing > 0
      ? `Esta categoría tiene ${tasksUsing} tarea(s) asignada(s). ¿Eliminar de todos modos?`
      : '¿Eliminar esta categoría?';
    if (!confirm(msg)) return;
    if (!this.catService.remove(id)) {
      alert('No puedes eliminar la última categoría.');
      return;
    }
    // Reassign orphaned tasks to first available category
    if (tasksUsing > 0) {
      const fallback = this.catService.categories()[0]?.id || 'otro';
      const updated = this.tasks().map(t => t.category === id ? { ...t, category: fallback } : t);
      this.tasks.set(updated);
      this.save();
    }
    if (this.filterCat() === id) this.filterCat.set('all');
  }

  addCategory(): void {
    if (!this.newCatLabel.trim()) return;
    this.catService.add({ label: this.newCatLabel.trim(), icon: this.newCatIcon || '📎', color: this.newCatColor });
    this.newCatLabel = '';
    this.newCatIcon = '📎';
    this.newCatColor = '#084983';
  }

  openNew() {
    this.form = this.freshForm();
    this.patientSearchQuery = '';
    this.newTaskTitle = '';
    this.newTaskDesc = '';
    this.newTaskDays = 0;
    this.showPatientDrop = false;
    this.editingId.set(null);
    this.showModal.set(true);
  }

  editGoal(g: TherapeuticTask) {
    this.form = { ...g, steps: [...g.steps.map(t => ({ ...t }))], tagsInput: (g.tags || []).join(', ') };
    this.patientSearchQuery = g.clientName;
    this.newTaskTitle = '';
    this.newTaskDesc = '';
    this.newTaskDays = 0;
    this.showPatientDrop = false;
    this.editingId.set(g.id);
    this.showModal.set(true);
  }

  selectPatient(p: Patient): void {
    this.form.patientId = p.id;
    this.form.clientName = `${p.firstName} ${p.lastName}`;
    this.patientSearchQuery = `${p.firstName} ${p.lastName}`;
    this.showPatientDrop = false;
  }

  clearPatient(): void {
    this.form.patientId = '';
    this.form.clientName = '';
    this.patientSearchQuery = '';
  }

  toggleStep(goal: TherapeuticTask, step: TaskStep) {
    step.done = !step.done;
    const total = goal.steps.length;
    const done = goal.steps.filter(t => t.done).length;
    goal.progress = Math.round((done / total) * 100);
    if (goal.progress === 100) goal.status = 'completada';
    this.save();
  }

  addStep() {
    if (!this.newTaskTitle.trim()) return;
    this.form.steps.push({
      id: crypto.randomUUID(),
      title: this.newTaskTitle.trim(),
      description: this.newTaskDesc.trim(),
      days: this.newTaskDays || 0,
      done: false
    });
    this.newTaskTitle = '';
    this.newTaskDesc = '';
    this.newTaskDays = 0;
  }

  removeStep(id: string) {
    this.form.steps = this.form.steps.filter((t: any) => t.id !== id);
  }

  saveTask() {
    const list = [...this.tasks()];
    const tags = (this.form.tagsInput || '').split(',').map((t: string) => t.trim()).filter(Boolean);
    const entry = { ...this.form, tags, tagsInput: undefined };
    if (this.editingId()) {
      const idx = list.findIndex(g => g.id === this.editingId());
      if (idx >= 0) list[idx] = entry;
    } else {
      list.push({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString().split('T')[0] });
    }
    this.tasks.set(list);
    this.save();
    this.showModal.set(false);
  }

  deleteTask() {
    if (!confirm('¿Eliminar esta tarea?')) return;
    this.tasks.set(this.tasks().filter(g => g.id !== this.editingId()));
    this.save();
    this.showModal.set(false);
  }

  private freshForm(): any {
    return {
      title: '', description: '', instructions: '', category: 'emocional',
      priority: 'media' as const, difficulty: 'media' as const,
      estimatedMinutes: 0, progress: 0, status: 'activa' as const,
      patientId: '', clientName: '', targetDate: '',
      steps: [], tags: [], tagsInput: '', createdAt: ''
    };
  }

  /** Load tasks and migrate legacy formats */
  private load(): TherapeuticTask[] {
    try {
      const raw = this.storage.get<any[]>(this.KEY) || [];
      return raw.map(g => this.migrateTask(g));
    } catch { return []; }
  }

  /** Migrate old goal/subGoals/tasks format to TherapeuticTask with steps */
  private migrateTask(g: any): TherapeuticTask {
    // Already migrated
    if (g.steps) return { ...g, tags: g.tags || [], instructions: g.instructions || '', difficulty: g.difficulty || 'media', estimatedMinutes: g.estimatedMinutes || 0 };
    // Migrate from tasks array
    if (g.tasks) {
      return {
        ...g,
        steps: g.tasks,
        tasks: undefined,
        tags: g.tags || [],
        instructions: g.instructions || '',
        difficulty: g.difficulty || 'media',
        estimatedMinutes: g.estimatedMinutes || 0
      };
    }
    // Migrate from legacy subGoals
    const legacySubs: { id: string; title: string; done: boolean }[] = g.subGoals || [];
    return {
      ...g,
      steps: legacySubs.map(s => ({
        id: s.id,
        title: s.title,
        description: '',
        days: 0,
        done: s.done
      })),
      tasks: undefined,
      subGoals: undefined,
      tags: [],
      instructions: '',
      difficulty: 'media',
      estimatedMinutes: 0
    };
  }

  private save() {
    this.storage.set(this.KEY, this.tasks());
  }
}
