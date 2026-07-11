import { Injectable, inject } from '@angular/core';
import { StorageService } from '../../../../core/services/storage.service';

export interface SimulatorProject {
  id: string;
  nombre: string;
  descripcion: string;
  estadoPublicacion: 'Borrador' | 'Publicado';
  themeColor: string;
  configuracion_arbol: {
    nodes: any[];
    edges: any[];
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class SimulatorStorageService {
  private storage = inject(StorageService);
  private readonly KEY = 'pd_simulators';

  getAll(): SimulatorProject[] {
    return this.storage.get<SimulatorProject[]>(this.KEY) || [];
  }

  getById(id: string): SimulatorProject | undefined {
    return this.getAll().find(s => s.id === id);
  }

  save(project: SimulatorProject): SimulatorProject {
    const all = this.getAll();
    const idx = all.findIndex(s => s.id === project.id);
    if (idx >= 0) {
      all[idx] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      project.id = project.id || 'sim-' + Date.now().toString(36);
      project.createdAt = project.createdAt || new Date().toISOString();
      project.updatedAt = new Date().toISOString();
      all.push(project);
    }
    this.storage.set(this.KEY, all);
    return project;
  }

  delete(id: string): void {
    const all = this.getAll().filter(s => s.id !== id);
    this.storage.set(this.KEY, all);
  }
}
