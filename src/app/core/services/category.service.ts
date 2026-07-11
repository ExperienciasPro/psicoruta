import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

export interface TaskCategory {
  id: string;
  label: string;
  color: string;
  icon: string;
}

const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: 'emocional', label: 'Bienestar Emocional', color: '#084983', icon: '💚' },
  { id: 'conductual', label: 'Cambio Conductual', color: '#009fe3', icon: '🔄' },
  { id: 'cognitivo', label: 'Habilidades Cognitivas', color: '#7BA0B5', icon: '🧠' },
  { id: 'relacional', label: 'Relaciones', color: '#33B2E8', icon: '🤝' },
  { id: 'autoestima', label: 'Autoestima', color: '#5BE098', icon: '⭐' },
  { id: 'otro', label: 'Otro', color: '#8AACC0', icon: '📌' },
];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private storage = inject(StorageService);
  private readonly KEY = 'pd_task_categories';

  /** Reactive categories signal */
  categories = signal<TaskCategory[]>(this.load());

  /** Get color for a category id */
  getColor(id: string): string {
    return this.categories().find(c => c.id === id)?.color || '#8AACC0';
  }

  /** Get icon for a category id */
  getIcon(id: string): string {
    return this.categories().find(c => c.id === id)?.icon || '📌';
  }

  /** Get label for a category id */
  getLabel(id: string): string {
    return this.categories().find(c => c.id === id)?.label || 'Otro';
  }

  /** Add a new category */
  add(cat: Omit<TaskCategory, 'id'>): TaskCategory {
    const newCat: TaskCategory = {
      ...cat,
      id: cat.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    };
    const list = [...this.categories(), newCat];
    this.categories.set(list);
    this.persist();
    return newCat;
  }

  /** Update an existing category */
  update(id: string, changes: Partial<Omit<TaskCategory, 'id'>>): void {
    const list = this.categories().map(c =>
      c.id === id ? { ...c, ...changes } : c
    );
    this.categories.set(list);
    this.persist();
  }

  /** Remove a category (returns false if it's the last one) */
  remove(id: string): boolean {
    if (this.categories().length <= 1) return false;
    const list = this.categories().filter(c => c.id !== id);
    this.categories.set(list);
    this.persist();
    return true;
  }

  /** Reorder categories */
  reorder(fromIndex: number, toIndex: number): void {
    const list = [...this.categories()];
    const [item] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, item);
    this.categories.set(list);
    this.persist();
  }

  /** Reset to defaults */
  resetDefaults(): void {
    this.categories.set([...DEFAULT_CATEGORIES]);
    this.persist();
  }

  private load(): TaskCategory[] {
    try {
      const stored = this.storage.get<TaskCategory[]>(this.KEY);
      if (stored && stored.length > 0) return stored;
      return [...DEFAULT_CATEGORIES];
    } catch {
      return [...DEFAULT_CATEGORIES];
    }
  }

  private persist(): void {
    this.storage.set(this.KEY, this.categories());
  }
}
