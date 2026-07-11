import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly STORAGE_KEY = 'um_catalog';
  private itemsSignal = signal<CatalogItem[]>([]);

  readonly activeItems = computed(() => this.itemsSignal().filter(i => i.active));
  readonly categories = computed(() => [...new Set(this.itemsSignal().map(i => i.category))]);

  constructor(private storage: StorageService) {
    const data = this.storage.get<CatalogItem[]>(this.STORAGE_KEY);
    if (data) this.itemsSignal.set(data);
  }
}
