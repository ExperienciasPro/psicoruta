import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

export interface MenuItem {
  id: string;
  name: string;
  available: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly STORAGE_KEY = 'um_menu';
  private menuItemsSignal = signal<MenuItem[]>([]);

  readonly items = this.menuItemsSignal.asReadonly();
  readonly availableItems = computed(() => this.menuItemsSignal().filter(i => i.available));

  constructor(private storage: StorageService) {
    const data = this.storage.get<MenuItem[]>(this.STORAGE_KEY);
    if (data) this.menuItemsSignal.set(data);
  }
}
