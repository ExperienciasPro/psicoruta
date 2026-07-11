import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../../core/services/storage.service';
import { PersonalizationService } from '../../../core/services/personalization.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="anl-page">
      <header class="a-header">
        <div>
          <h1 class="a-title">Analítica de Práctica</h1>
          <p class="a-subtitle">Métricas consolidadas de tu actividad clínica</p>
        </div>
        <div class="a-period-toggle">
          <button class="a-period-btn" [class.active]="period() === 'week'" (click)="period.set('week')">Semana</button>
          <button class="a-period-btn" [class.active]="period() === 'month'" (click)="period.set('month')">Mes</button>
          <button class="a-period-btn" [class.active]="period() === 'year'" (click)="period.set('year')">Año</button>
        </div>
      </header>

      <!-- KPI Cards -->
      <div class="a-kpis">
        @for (kpi of kpis(); track kpi.label) {
          <div class="a-kpi-card">
            <div class="a-kpi-icon" [style.background]="kpi.color + '18'" [style.color]="kpi.color">{{ kpi.icon }}</div>
            <div class="a-kpi-info">
              <span class="a-kpi-value">{{ kpi.value }}</span>
              <span class="a-kpi-label">{{ kpi.label }}</span>
            </div>
            <span class="a-kpi-trend" [class.positive]="kpi.trend >= 0" [class.negative]="kpi.trend < 0">
              {{ kpi.trend >= 0 ? '↑' : '↓' }} {{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}%
            </span>
          </div>
        }
      </div>

      <!-- Charts Row -->
      <div class="a-charts-row">
        <!-- Sessions per day (bar chart) -->
        <div class="a-chart-card">
          <h3 class="a-chart-title">Sesiones por Día</h3>
          <div class="a-bar-chart">
            @for (bar of sessionBars(); track bar.label) {
              <div class="a-bar-col">
                <div class="a-bar" [style.height.%]="bar.pct" [style.background]="bar.isToday ? 'var(--accent-primary)' : 'var(--accent-primary, #084983)'" [style.opacity]="bar.isToday ? 1 : 0.4"></div>
                <span class="a-bar-label">{{ bar.label }}</span>
                <span class="a-bar-value">{{ bar.value }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Category Distribution -->
        <div class="a-chart-card">
          <h3 class="a-chart-title">Distribución por Categoría</h3>
          <div class="a-donut-placeholder">
            @for (cat of categoryDist(); track cat.label) {
              <div class="a-cat-row">
                <span class="a-cat-dot" [style.background]="cat.color"></span>
                <span class="a-cat-label">{{ cat.label }}</span>
                <div class="a-cat-bar-wrap">
                  <div class="a-cat-bar" [style.width.%]="cat.pct" [style.background]="cat.color"></div>
                </div>
                <span class="a-cat-pct">{{ cat.pct }}%</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="a-bottom-row">
        <!-- Goal Progress -->
        <div class="a-chart-card">
          <h3 class="a-chart-title">Progreso de Metas</h3>
          <div class="a-goals-list">
            @for (goal of topGoals(); track goal.title) {
              <div class="a-goal-item">
                <div class="a-goal-info">
                  <span class="a-goal-name">{{ goal.title }}</span>
                  <span class="a-goal-client">{{ goal.clientName }}</span>
                </div>
                <div class="a-goal-bar-wrap">
                  <div class="a-goal-bar" [style.width.%]="goal.progress" [style.background]="goal.color"></div>
                </div>
                <span class="a-goal-pct">{{ goal.progress }}%</span>
              </div>
            }
            @if (topGoals().length === 0) {
              <p class="a-no-data">Aún no hay metas registradas.</p>
            }
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="a-chart-card">
          <h3 class="a-chart-title">Actividad Reciente</h3>
          <div class="a-activity-list">
            @for (act of recentActivity(); track act.id) {
              <div class="a-activity-item">
                <span class="a-act-icon">{{ act.icon }}</span>
                <div class="a-act-info">
                  <span class="a-act-text">{{ act.text }}</span>
                  <span class="a-act-time">{{ act.time }}</span>
                </div>
              </div>
            }
            @if (recentActivity().length === 0) {
              <p class="a-no-data">Sin actividad reciente.</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit {
  private storage = inject(StorageService);
  private pz = inject(PersonalizationService);

  period = signal<'week' | 'month' | 'year'>('month');

  // Data sources
  private appointments: any[] = [];
  private goals: any[] = [];
  private projects: any[] = [];

  ngOnInit() {
    try { this.appointments = this.storage.get<any[]>('pd_appointments') || []; } catch {}
    try { this.goals = this.storage.get<any[]>('pd_goals') || []; } catch {}
    try { this.projects = this.storage.get<any[]>('pd_projects') || []; } catch {}
  }

  kpis = computed(() => {
    const totalAppts = this.appointments.length;
    const activeGoals = this.goals.filter((g: any) => g.status === 'activa').length;
    const completedGoals = this.goals.filter((g: any) => g.status === 'completada').length;
    const activeProjects = this.projects.filter((p: any) => p.status === 'en_curso').length;
    const avgProgress = this.goals.length ? Math.round(this.goals.reduce((s: number, g: any) => s + (g.progress || 0), 0) / this.goals.length) : 0;

    return [
      { icon: '📅', label: 'Total Citas', value: totalAppts, color: '#084983', trend: 12 },
      { icon: '🎯', label: 'Metas Activas', value: activeGoals, color: '#009fe3', trend: 8 },
      { icon: '✅', label: 'Metas Completadas', value: completedGoals, color: '#7BA0B5', trend: 15 },
      { icon: '📋', label: 'Proyectos Activos', value: activeProjects, color: '#33B2E8', trend: -5 },
      { icon: '📊', label: 'Progreso Promedio', value: avgProgress + '%', color: '#5BE098', trend: 3 },
    ];
  });

  sessionBars = computed(() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date().getDay();
    const counts = days.map(() => Math.floor(Math.random() * 6) + 1); // Mock data
    const max = Math.max(...counts, 1);
    return days.map((d, i) => ({ label: d, value: counts[i], pct: (counts[i] / max) * 100, isToday: (i + 1) % 7 === today }));
  });

  categoryDist = computed(() => {
    const cats: Record<string, number> = {};
    for (const g of this.goals) {
      const cat = g.category || 'otro';
      cats[cat] = (cats[cat] || 0) + 1;
    }
    const total = Object.values(cats).reduce((s, v) => s + v, 0) || 1;
    const colorMap: Record<string, string> = { emocional: '#084983', conductual: '#009fe3', cognitivo: '#7BA0B5', relacional: '#33B2E8', autoestima: '#5BE098', otro: '#8AACC0' };
    const labelMap: Record<string, string> = { emocional: 'Emocional', conductual: 'Conductual', cognitivo: 'Cognitivo', relacional: 'Relacional', autoestima: 'Autoestima', otro: 'Otro' };

    if (Object.keys(cats).length === 0) {
      return [
        { label: 'Emocional', pct: 40, color: '#084983' },
        { label: 'Conductual', pct: 25, color: '#009fe3' },
        { label: 'Cognitivo', pct: 20, color: '#7BA0B5' },
        { label: 'Relacional', pct: 15, color: '#33B2E8' },
      ];
    }
    return Object.entries(cats).map(([k, v]) => ({ label: labelMap[k] || k, pct: Math.round((v / total) * 100), color: colorMap[k] || '#8AACC0' }));
  });

  topGoals = computed(() => {
    const colorMap: Record<string, string> = { emocional: '#084983', conductual: '#009fe3', cognitivo: '#7BA0B5', relacional: '#33B2E8', autoestima: '#5BE098', otro: '#8AACC0' };
    return this.goals
      .filter((g: any) => g.status === 'activa')
      .sort((a: any, b: any) => b.progress - a.progress)
      .slice(0, 5)
      .map((g: any) => ({ title: g.title, clientName: g.clientName, progress: g.progress, color: colorMap[g.category] || '#8AACC0' }));
  });

  recentActivity = computed(() => {
    const acts: { id: string; icon: string; text: string; time: string }[] = [];
    for (const a of this.appointments.slice(-5).reverse()) {
      acts.push({ id: a.id, icon: '📅', text: `Cita con ${a.clientName}`, time: a.date });
    }
    for (const g of this.goals.filter((g: any) => g.status === 'completada').slice(-3)) {
      acts.push({ id: g.id, icon: '✅', text: `Meta completada: ${g.title}`, time: g.createdAt || 'Reciente' });
    }
    return acts.slice(0, 8);
  });
}
