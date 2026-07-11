import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  startDate: string;
  targetDate: string;
  createdAt: string;
  parentId?: string;
  tags?: string[];
  mode?: 'sales' | 'project' | 'personal';
}

@Injectable({ providedIn: 'root' })
export class GoalService {
  private readonly STORAGE_KEY = 'um_goals';

  private goalsSignal = signal<Goal[]>([]);

  readonly goals = this.goalsSignal.asReadonly();

  readonly activeGoals = computed(() =>
    this.goalsSignal().filter(g => g.status === 'in_progress')
  );

  readonly completedGoals = computed(() =>
    this.goalsSignal().filter(g => g.status === 'completed')
  );

  constructor(private storage: StorageService) {
    this.loadFromStorage();
  }

  create(goal: Omit<Goal, 'id' | 'createdAt'>): Goal {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.goalsSignal.update(goals => [...goals, newGoal]);
    this.saveToStorage();
    return newGoal;
  }

  update(id: string, changes: Partial<Goal>): void {
    this.goalsSignal.update(goals =>
      goals.map(g => (g.id === id ? { ...g, ...changes } : g))
    );
    this.saveToStorage();
  }

  delete(id: string): void {
    this.goalsSignal.update(goals => goals.filter(g => g.id !== id));
    this.saveToStorage();
  }

  getById(id: string): Goal | undefined {
    return this.goalsSignal().find(g => g.id === id);
  }

  private loadFromStorage(): void {
    const data = this.storage.get<Goal[]>(this.STORAGE_KEY);
    if (data) {
      this.goalsSignal.set(data);
    }
  }

  private saveToStorage(): void {
    this.storage.set(this.STORAGE_KEY, this.goalsSignal());
  }
}
