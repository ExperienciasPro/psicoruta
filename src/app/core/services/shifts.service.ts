import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

export interface ShiftMember {
  id: string;
  name: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class ShiftsService {
  private readonly STORAGE_KEY = 'um_shifts';
  private membersSignal = signal<ShiftMember[]>([]);

  readonly activeMembers = computed(() => this.membersSignal().filter(m => m.active));

  constructor(private storage: StorageService) {
    const data = this.storage.get<ShiftMember[]>(this.STORAGE_KEY);
    if (data) this.membersSignal.set(data);
  }
}
