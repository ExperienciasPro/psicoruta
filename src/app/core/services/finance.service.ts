import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly STORAGE_KEY = 'um_finance';

  readonly totalCurrentValue = signal(0);
  readonly totalInvested = signal(0);

  constructor(private storage: StorageService) {
    const data = this.storage.get<{ currentValue: number; invested: number }>(this.STORAGE_KEY);
    if (data) {
      this.totalCurrentValue.set(data.currentValue || 0);
      this.totalInvested.set(data.invested || 0);
    }
  }
}
