import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage.service';
import { PersonalizationService } from '../../../core/services/personalization.service';

interface Project {
  id: string; title: string; description: string; type: string;
  status: 'planificado' | 'en_curso' | 'completado' | 'archivado';
  startDate: string; endDate: string; participants: string[];
  leader?: string;
  tasks: { id: string; title: string; status: 'pendiente' | 'en_curso' | 'completada'; assignee?: string }[];
}

const PROJECT_TYPES = [
  { id: 'terapia_grupal', label: 'Terapia Grupal', icon: '👥', color: '#084983' },
  { id: 'taller', label: 'Taller / Workshop', icon: '🎓', color: '#009fe3' },
  { id: 'investigacion', label: 'Investigación', icon: '🔬', color: '#7BA0B5' },
  { id: 'programa', label: 'Programa Clínico', icon: '📋', color: '#C49BBB' },
  { id: 'otro', label: 'Otro', icon: '📌', color: '#9BA8AA' },
];

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="proj-page">
      <header class="p-header">
        <div>
          <h1 class="p-title">Proyectos Clínicos</h1>
          <p class="p-subtitle">Programas, talleres e investigaciones de tu práctica</p>
        </div>
        <button class="p-btn-new" (click)="openNew()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nuevo Proyecto
        </button>
      </header>

      <!-- Kanban columns -->
      <div class="p-kanban">
        @for (col of columns; track col.id) {
          <div class="p-column">
            <div class="p-col-header">
              <span class="p-col-dot" [style.background]="col.color"></span>
              <span class="p-col-title">{{ col.label }}</span>
              <span class="p-col-count">{{ getByStatus(col.id).length }}</span>
            </div>
            <div class="p-col-body">
              @for (proj of getByStatus(col.id); track proj.id) {
                <div class="p-card" (click)="editProject(proj)">
                  <div class="p-card-type">
                    <span class="p-type-badge" [style.background]="getTypeColor(proj.type) + '18'" [style.color]="getTypeColor(proj.type)">
                      {{ getTypeIcon(proj.type) }} {{ getTypeLabel(proj.type) }}
                    </span>
                  </div>
                  <h4 class="p-card-title">{{ proj.title }}</h4>
                  @if (proj.leader) {
                    <div class="p-leader-badge">👑 {{ proj.leader }}</div>
                  }
                  <p class="p-card-desc">{{ proj.description }}</p>
                  @if (proj.tasks.length > 0) {
                    <div class="p-tasks-bar">
                      <div class="p-tasks-fill" [style.width.%]="getTaskProgress(proj)"></div>
                    </div>
                    <span class="p-tasks-label">{{ getCompletedTasks(proj) }}/{{ proj.tasks.length }} tareas</span>
                  }
                  @if (proj.participants.length > 0) {
                    <div class="p-participants">
                      @for (p of proj.participants.slice(0, 3); track p) {
                        <div class="p-avatar">{{ p.charAt(0) }}</div>
                      }
                      @if (proj.participants.length > 3) {
                        <span class="p-more-p">+{{ proj.participants.length - 3 }}</span>
                      }
                    </div>
                  }
                  <div class="p-card-dates">{{ proj.startDate }} → {{ proj.endDate || '...' }}</div>
                </div>
              }
              @if (getByStatus(col.id).length === 0) {
                <div class="p-col-empty">Sin proyectos</div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="p-modal-bg" (click)="showModal.set(false)"></div>
        <div class="p-modal">
          <div class="p-modal-header">
            <h3>{{ editingId() ? 'Editar Proyecto' : 'Nuevo Proyecto' }}</h3>
            <button class="p-modal-close" (click)="showModal.set(false)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="p-modal-body">
            <div class="p-field"><label>Título</label><input type="text" [(ngModel)]="form.title" placeholder="Nombre del proyecto"></div>
            <div class="p-field"><label>Descripción</label><textarea [(ngModel)]="form.description" rows="3" placeholder="En qué consiste..."></textarea></div>
            <div class="p-field-row">
              <div class="p-field">
                <label>Tipo</label>
                <select [(ngModel)]="form.type">@for (t of projectTypes; track t.id) { <option [value]="t.id">{{ t.icon }} {{ t.label }}</option> }</select>
              </div>
              <div class="p-field">
                <label>Estado</label>
                <select [(ngModel)]="form.status">
                  <option value="planificado">Planificado</option>
                  <option value="en_curso">En Curso</option>
                  <option value="completado">Completado</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
            </div>
            <div class="p-field">
              <label>Líder del Proyecto</label>
              <select [(ngModel)]="form.leader">
                <option value="">Sin líder</option>
                @for (p of form.participants; track p) {
                  <option [value]="p">{{ p }}</option>
                }
              </select>
            </div>
            <div class="p-field-row">
              <div class="p-field"><label>Inicio</label><input type="date" [(ngModel)]="form.startDate"></div>
              <div class="p-field"><label>Fin</label><input type="date" [(ngModel)]="form.endDate"></div>
            </div>
            <div class="p-field">
              <label>Participantes</label>
              <div class="p-input-row">
                <input type="text" [(ngModel)]="newParticipant" placeholder="Nombre..." (keydown.enter)="addParticipant()">
                <button class="p-add-btn" (click)="addParticipant()">+</button>
              </div>
              <div class="p-chip-list">
                @for (p of form.participants; track p) {
                  <span class="p-chip">{{ p }} <button (click)="removeParticipant(p)">×</button></span>
                }
              </div>
            </div>
            <div class="p-field">
              <label>Tareas</label>
              <div class="p-input-row">
                <input type="text" [(ngModel)]="newTask" placeholder="Nueva tarea..." (keydown.enter)="addTask()">
                <button class="p-add-btn" (click)="addTask()">+</button>
              </div>
              @for (task of form.tasks; track task.id) {
                <div class="p-task-item">
                  <button class="p-task-check" [class.done]="task.status === 'completada'" (click)="cycleTaskStatus(task)">
                    {{ task.status === 'completada' ? '✓' : task.status === 'en_curso' ? '◐' : '' }}
                  </button>
                  <span [class.task-done]="task.status === 'completada'">{{ task.title }}</span>
                    @if (task.assignee) { <span class="p-task-assignee">{{ task.assignee }}</span> }
                  <select class="p-task-assignee-select" [ngModel]="task.assignee || ''" (ngModelChange)="task.assignee = $event || undefined">
                      <option value="">Sin asignar</option>
                      @for (p of form.participants; track p) {
                        <option [value]="p">{{ p }}</option>
                      }
                    </select>
                    <button class="p-task-del" (click)="removeTask(task.id)">×</button>
                </div>
              }
            </div>
          </div>
          <div class="p-modal-footer">
            @if (editingId()) { <button class="p-btn-delete" (click)="deleteProject()">Eliminar</button> }
            <div style="flex:1"></div>
            <button class="p-btn-cancel" (click)="showModal.set(false)">Cancelar</button>
            <button class="p-btn-save" [disabled]="!form.title.trim()" (click)="saveProject()">Guardar</button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  private storage = inject(StorageService);
  private pz = inject(PersonalizationService);
  private readonly KEY = 'pd_projects';

  projectTypes = PROJECT_TYPES;
  columns = [
    { id: 'planificado', label: 'Planificado', color: '#7BA0B5' },
    { id: 'en_curso', label: 'En Curso', color: '#084983' },
    { id: 'completado', label: 'Completado', color: '#009fe3' },
    { id: 'archivado', label: 'Archivado', color: '#9BA8AA' },
  ];

  projects = signal<Project[]>(this.load());
  showModal = signal(false);
  editingId = signal<string | null>(null);
  newParticipant = '';
  newTask = '';
  form: any = this.freshForm();

  getByStatus(status: string) { return this.projects().filter(p => p.status === status); }
  getTypeColor(id: string) { return PROJECT_TYPES.find(t => t.id === id)?.color || '#9BA8AA'; }
  getTypeIcon(id: string) { return PROJECT_TYPES.find(t => t.id === id)?.icon || '📌'; }
  getTypeLabel(id: string) { return PROJECT_TYPES.find(t => t.id === id)?.label || 'Otro'; }
  getTaskProgress(p: Project) { return p.tasks.length ? Math.round(p.tasks.filter(t => t.status === 'completada').length / p.tasks.length * 100) : 0; }
  getCompletedTasks(p: Project) { return p.tasks.filter(t => t.status === 'completada').length; }

  openNew() { this.form = this.freshForm(); this.editingId.set(null); this.showModal.set(true); }
  editProject(p: Project) {
    this.form = { ...p, participants: [...p.participants], tasks: p.tasks.map(t => ({ ...t })) };
    this.editingId.set(p.id); this.showModal.set(true);
  }

  addParticipant() { if (this.newParticipant.trim()) { this.form.participants.push(this.newParticipant.trim()); this.newParticipant = ''; } }
  removeParticipant(p: string) { this.form.participants = this.form.participants.filter((x: string) => x !== p); }
  addTask() { if (this.newTask.trim()) { this.form.tasks.push({ id: crypto.randomUUID(), title: this.newTask.trim(), status: 'pendiente' }); this.newTask = ''; } }
  removeTask(id: string) { this.form.tasks = this.form.tasks.filter((t: any) => t.id !== id); }
  cycleTaskStatus(task: any) {
    const order = ['pendiente', 'en_curso', 'completada'];
    task.status = order[(order.indexOf(task.status) + 1) % 3];
  }

  saveProject() {
    const list = [...this.projects()];
    if (this.editingId()) { const idx = list.findIndex(p => p.id === this.editingId()); if (idx >= 0) list[idx] = { ...this.form }; }
    else { list.push({ ...this.form, id: crypto.randomUUID() }); }
    this.projects.set(list); this.save(); this.showModal.set(false);
  }

  deleteProject() {
    if (!confirm('¿Eliminar este proyecto?')) return;
    this.projects.set(this.projects().filter(p => p.id !== this.editingId())); this.save(); this.showModal.set(false);
  }

  private freshForm(): any {
    return { title: '', description: '', type: 'programa', status: 'planificado' as const, startDate: '', endDate: '', participants: [], leader: '', tasks: [] };
  }
  private load(): Project[] { try { return this.storage.get<Project[]>(this.KEY) || []; } catch { return []; } }
  private save() { this.storage.set(this.KEY, this.projects()); }
}
