import { Component, computed, inject } from '@angular/core';
import { TaskService } from '../../../core/services/task.service';
import { GoalService } from '../../../core/services/goal.service';
import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring';

@Component({
  selector: 'um-today',
  standalone: true,
  imports: [ProgressRingComponent],
  template: `
    <div class="today-screen">
      <!-- Greeting -->
      <div class="today-greeting animate-fadeInUp">
        <p class="greeting-text">{{ greeting() }}</p>
        <p class="greeting-date">{{ dateString() }}</p>
      </div>

      <!-- Focus Card -->
      <div class="focus-card animate-fadeInUp stagger-1">
        @if (focusTask(); as task) {
          <div class="focus-header">
            <span class="focus-badge">ENFOQUE HOY</span>
          </div>
          <h2 class="focus-title">{{ task.title }}</h2>
          @if (task.description) {
            <p class="focus-description">{{ task.description }}</p>
          }
          <div class="focus-progress">
            <um-progress-ring [value]="dailyProgress()" [size]="72" [strokeWidth]="5" />
            <div class="progress-info">
              <span class="progress-label">Progreso del día</span>
              <span class="progress-stat">{{ completedToday() }}/{{ totalToday() }} tareas</span>
            </div>
          </div>
          <button class="complete-btn" (click)="completeTask(task.id)">
            ✓ Completar
          </button>
        } @else {
          <div class="focus-empty">
            <span class="empty-emoji">🧘</span>
            <h3>Todo completado</h3>
            <p>No tienes tareas pendientes por hoy.</p>
          </div>
        }
      </div>

      <!-- Quick Stats -->
      <div class="stats-row animate-fadeInUp stagger-2">
        <div class="stat-pill">
          <span class="stat-icon">🎯</span>
          <div class="stat-info">
            <span class="stat-value">{{ activeGoalCount() }}</span>
            <span class="stat-label">Metas</span>
          </div>
        </div>
        <div class="stat-pill">
          <span class="stat-icon">✅</span>
          <div class="stat-info">
            <span class="stat-value">{{ completedToday() }}</span>
            <span class="stat-label">Hechas</span>
          </div>
        </div>
        <div class="stat-pill">
          <span class="stat-icon">📋</span>
          <div class="stat-info">
            <span class="stat-value">{{ pendingCount() }}</span>
            <span class="stat-label">Quedan</span>
          </div>
        </div>
      </div>

      <!-- Upcoming Tasks -->
      <div class="upcoming-section animate-fadeInUp stagger-3">
        <h3 class="section-title">Siguientes</h3>
        @if (upcomingTasks().length) {
          @for (task of upcomingTasks(); track task.id) {
            <div class="upcoming-item">
              <span class="task-priority-dot" [class]="task.priority"></span>
              <span class="task-name">{{ task.title }}</span>
              @if (task.estimatedMinutes) {
                <span class="task-time">{{ task.estimatedMinutes }}m</span>
              }
            </div>
          }
        } @else {
          <p class="no-tasks">Sin más tareas programadas.</p>
        }
      </div>
    </div>
  `,
  styleUrl: 'today.scss',
})
export class TodayComponent {
  private taskService = inject(TaskService);
  private goalService = inject(GoalService);

  focusTask = computed(() => this.taskService.getTodaysFocusTask());
  activeGoalCount = computed(() => this.goalService.activeGoals().length);
  pendingCount = computed(() => this.taskService.pendingTasks().length);

  completedToday = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.taskService.tasks().filter(t => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;
  });

  totalToday = computed(() => this.completedToday() + this.pendingCount());

  dailyProgress = computed(() => {
    const total = this.totalToday();
    return total ? Math.round((this.completedToday() / total) * 100) : 0;
  });

  upcomingTasks = computed(() => {
    return this.taskService.pendingTasks()
      .filter(t => t.id !== this.focusTask()?.id)
      .slice(0, 4);
  });

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️ Buenos días';
    if (hour < 18) return '🌤️ Buenas tardes';
    return '🌙 Buenas noches';
  });

  dateString = computed(() => {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  });

  completeTask(id: string): void {
    this.taskService.complete(id);
  }
}
