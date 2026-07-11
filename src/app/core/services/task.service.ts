import { Injectable, signal, computed } from '@angular/core';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly STORAGE_KEY = 'um_tasks';

  private tasksSignal = signal<Task[]>([]);

  readonly tasks = this.tasksSignal.asReadonly();
  readonly pendingTasks = computed(() =>
    this.tasksSignal().filter((t) => t.status === 'pending' || t.status === 'in_progress')
  );

  constructor(private storage: StorageService) {
    this.loadFromStorage();
  }

  create(task: Omit<Task, 'id' | 'createdAt' | 'notes'>): Task {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      notes: [],
    };
    this.tasksSignal.update((tasks) => [...tasks, newTask]);
    this.saveToStorage();
    return newTask;
  }

  update(id: string, changes: Partial<Task>): void {
    this.tasksSignal.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, ...changes } : t))
    );
    this.saveToStorage();
  }

  complete(id: string): void {
    this.update(id, { status: 'completed', completedAt: new Date() });
  }

  delete(id: string): void {
    this.tasksSignal.update((tasks) => tasks.filter((t) => t.id !== id));
    this.saveToStorage();
  }

  getByGoalId(goalId: string): Task[] {
    return this.tasksSignal()
      .filter((t) => t.goalId === goalId)
      .sort((a, b) => a.order - b.order);
  }

  getNextPendingTask(goalId: string): Task | undefined {
    return this.getByGoalId(goalId).find((t) => t.status === 'pending');
  }

  getTodaysFocusTask(): Task | undefined {
    const pending = this.tasksSignal()
      .filter((t) => t.status === 'pending' || t.status === 'in_progress')
      .sort((a, b) => {
        const priorityOrder: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    return pending[0];
  }

  addNote(taskId: string, note: string): void {
    const task = this.tasksSignal().find((t) => t.id === taskId);
    if (task) {
      this.update(taskId, { notes: [...task.notes, note] });
    }
  }

  private loadFromStorage(): void {
    const data = this.storage.get<Task[]>(this.STORAGE_KEY);
    if (data) {
      this.tasksSignal.set(data);
    }
  }

  private saveToStorage(): void {
    this.storage.set(this.STORAGE_KEY, this.tasksSignal());
  }
}
