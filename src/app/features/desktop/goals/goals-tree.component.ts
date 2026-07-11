import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../../core/services/storage.service';
import { PersonalizationService } from '../../../core/services/personalization.service';
import { ClinicaService } from '../../../core/services/clinica.service';
import { CategoryService } from '../../../core/services/category.service';

interface GoalNode {
  id: string; title: string; progress: number; category: string; patientId?: string; clientName: string;
  status: string; tasks: { id: string; title: string; description: string; days: number; done: boolean }[];
}

@Component({
  selector: 'app-goals-tree',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-page">
      <header class="t-header">
        <div>
          <h1 class="t-title">Árbol de Metas</h1>
          <p class="t-subtitle">Vista jerárquica de las metas terapéuticas agrupadas por {{ clientPlural() }}</p>
        </div>
        <div class="t-legend">
          @for (cat of catList(); track cat.label) {
            <span class="t-legend-item" [style.color]="cat.color">
              {{ cat.icon }} {{ cat.label }}
            </span>
          }
        </div>
      </header>

      @if (clients().length === 0) {
        <div class="t-empty">
          <span class="t-empty-icon">🌳</span>
          <h3>Sin metas registradas</h3>
          <p>Crea metas terapéuticas en el Banco de Metas para verlas aquí como un árbol interactivo.</p>
        </div>
      }

      <div class="t-tree">
        @for (client of clients(); track client.name) {
          <div class="t-client-node">
            <div class="t-client-header">
              <div class="t-client-avatar">{{ client.name.charAt(0) }}</div>
              <div class="t-client-info">
                <span class="t-client-name">{{ client.name }}</span>
                <span class="t-client-stats">{{ client.goals.length }} metas · {{ client.avgProgress }}% progreso</span>
              </div>
              <div class="t-client-bar">
                <div class="t-client-fill" [style.width.%]="client.avgProgress"></div>
              </div>
            </div>
            <div class="t-branches">
              @for (goal of client.goals; track goal.id) {
                <div class="t-goal-branch">
                  <div class="t-connector"></div>
                  <div class="t-goal-node" [style.border-left-color]="getColor(goal.category)">
                    <div class="t-goal-top">
                      <span class="t-goal-icon">{{ getIcon(goal.category) }}</span>
                      <span class="t-goal-title">{{ goal.title }}</span>
                      <span class="t-goal-pct" [style.color]="getColor(goal.category)">{{ goal.progress }}%</span>
                    </div>
                    <div class="t-goal-bar">
                      <div class="t-goal-fill" [style.width.%]="goal.progress" [style.background]="getColor(goal.category)"></div>
                    </div>
                    @if (goal.tasks.length > 0) {
                      <div class="t-sub-branches">
                        @for (task of goal.tasks; track task.id) {
                          <div class="t-sub-node" [class.done]="task.done">
                            <span class="t-sub-dot" [style.background]="task.done ? getColor(goal.category) : 'var(--border-default)'"></span>
                            <span>{{ task.title }}</span>
                            @if (task.days > 0) {
                              <span class="t-task-days">{{ task.days }}d</span>
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
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;

    .tree-page { padding: 40px 48px; max-width: 1200px; margin: 0 auto; }
    .t-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; }
    .t-title { font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .t-subtitle { font-size: 14px; color: var(--text-secondary); margin: 0; }
    .t-legend { display: flex; gap: 16px; flex-wrap: wrap; }
    .t-legend-item { font-size: 12px; font-weight: 600; }

    .t-empty { text-align: center; padding: 80px 40px; background: var(--bg-secondary); border-radius: 20px;
      .t-empty-icon { font-size: 48px; }
      h3 { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 16px 0 8px; }
      p { color: var(--text-secondary); font-size: 14px; margin: 0; }
    }

    .t-tree { display: flex; flex-direction: column; gap: 24px; }

    .t-client-node { background: var(--bg-secondary, #F2EFE9); border-radius: 18px; padding: 20px; }
    .t-client-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
    .t-client-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px; flex-shrink: 0; }
    .t-client-info { display: flex; flex-direction: column; gap: 2px; }
    .t-client-name { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 16px; color: var(--text-primary); }
    .t-client-stats { font-size: 12px; color: var(--text-muted); }
    .t-client-bar { flex: 1; max-width: 200px; height: 6px; background: rgba(0,0,0,0.06); border-radius: 3px; overflow: hidden; margin-left: auto; }
    .t-client-fill { height: 100%; background: var(--accent-primary); border-radius: 3px; transition: width 0.3s; }

    .t-branches { display: flex; flex-direction: column; gap: 10px; padding-left: 20px; }
    .t-goal-branch { display: flex; align-items: flex-start; gap: 0; position: relative; }
    .t-connector { width: 24px; min-height: 40px; border-left: 2px solid var(--border-default); border-bottom: 2px solid var(--border-default); border-radius: 0 0 0 10px; flex-shrink: 0; margin-top: -10px; }

    .t-goal-node { flex: 1; background: var(--bg-primary, white); border-radius: 12px; padding: 14px 16px; border-left: 3px solid; display: flex; flex-direction: column; gap: 8px; }
    .t-goal-top { display: flex; align-items: center; gap: 8px; }
    .t-goal-icon { font-size: 14px; }
    .t-goal-title { flex: 1; font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .t-goal-pct { font-size: 13px; font-weight: 800; font-family: 'Outfit', sans-serif; }
    .t-goal-bar { height: 4px; background: rgba(0,0,0,0.06); border-radius: 2px; overflow: hidden; }
    .t-goal-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }

    .t-sub-branches { display: flex; flex-direction: column; gap: 4px; padding-left: 8px; }
    .t-sub-node { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary);
      &.done { text-decoration: line-through; opacity: 0.5; }
    }
    .t-sub-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .t-task-days { font-size: 10px; font-weight: 700; color: var(--accent-primary); background: rgba(8,73,131,0.12); padding: 1px 5px; border-radius: 4px; }

    @media (max-width: 768px) { .tree-page { padding: 24px 16px; } .t-header { flex-direction: column; gap: 12px; } }
  `]
})
export class GoalsTreeComponent {
  private storage = inject(StorageService);
  private pz = inject(PersonalizationService);
  private clinicaService = inject(ClinicaService);
  private catService = inject(CategoryService);
  clientPlural = this.pz.clientPlural;

  catList = computed(() => this.catService.categories().map(c => ({ label: c.label, color: c.color, icon: c.icon })));

  allGoals = signal<GoalNode[]>(this.load());

  clients = computed(() => {
    const map = new Map<string, GoalNode[]>();
    for (const g of this.allGoals()) {
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

  getColor(cat: string) { return this.catService.getColor(cat); }
  getIcon(cat: string) { return this.catService.getIcon(cat); }

  private load(): GoalNode[] {
    try {
      const raw = this.storage.get<any[]>('pd_goals') || [];
      return raw.map(g => {
        if (g.tasks) return g;
        // Migrate legacy subGoals → tasks
        const legacySubs: { id: string; title: string; done: boolean }[] = g.subGoals || [];
        return {
          ...g,
          tasks: legacySubs.map((s: any) => ({ id: s.id, title: s.title, description: '', days: 0, done: s.done })),
        };
      });
    } catch { return []; }
  }
}
