import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly STORAGE_KEY = 'um_projects';
  private projectsSignal = signal<Project[]>([]);

  readonly projects = this.projectsSignal.asReadonly();

  constructor(private storage: StorageService) {
    const data = this.storage.get<Project[]>(this.STORAGE_KEY);
    if (data) this.projectsSignal.set(data);
  }
}
