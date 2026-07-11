import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

export interface Deal {
  id: string;
  contactName: string;
  value: number;
  stage: string;
  status: 'open' | 'won' | 'lost';
  funnelId: string;
  createdAt: string;
  closedAt?: string;
}

export interface FunnelStage {
  id: string;
  name: string;
}

export interface Funnel {
  id: string;
  name: string;
  stages: FunnelStage[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly DEALS_KEY = 'um_deals';
  private readonly FUNNELS_KEY = 'um_funnels';

  private dealsSignal = signal<Deal[]>([]);
  private funnelsSignal = signal<Funnel[]>([]);

  readonly deals = this.dealsSignal.asReadonly();
  readonly funnels = this.funnelsSignal.asReadonly();

  readonly openDeals = computed(() =>
    this.dealsSignal().filter(d => d.status === 'open')
  );

  readonly wonDeals = computed(() =>
    this.dealsSignal().filter(d => d.status === 'won')
  );

  readonly totalPipelineValue = computed(() =>
    this.openDeals().reduce((sum, d) => sum + d.value, 0)
  );

  readonly lostDeals = computed(() =>
    this.dealsSignal().filter(d => d.status === 'lost')
  );

  constructor(private storage: StorageService) {
    this.loadFromStorage();
  }

  createDeal(deal: Omit<Deal, 'id' | 'createdAt'>): Deal {
    const newDeal: Deal = {
      ...deal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.dealsSignal.update(deals => [...deals, newDeal]);
    this.saveDeals();
    return newDeal;
  }

  updateDeal(id: string, changes: Partial<Deal>): void {
    this.dealsSignal.update(deals =>
      deals.map(d => (d.id === id ? { ...d, ...changes } : d))
    );
    this.saveDeals();
  }

  deleteDeal(id: string): void {
    this.dealsSignal.update(deals => deals.filter(d => d.id !== id));
    this.saveDeals();
  }

  createFunnel(funnel: Omit<Funnel, 'id' | 'createdAt'>): Funnel {
    const newFunnel: Funnel = {
      ...funnel,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.funnelsSignal.update(funnels => [...funnels, newFunnel]);
    this.saveFunnels();
    return newFunnel;
  }

  updateFunnel(id: string, changes: Partial<Funnel>): void {
    this.funnelsSignal.update(funnels =>
      funnels.map(f => (f.id === id ? { ...f, ...changes } : f))
    );
    this.saveFunnels();
  }

  deleteFunnel(id: string): void {
    this.funnelsSignal.update(funnels => funnels.filter(f => f.id !== id));
    this.saveFunnels();
  }

  private loadFromStorage(): void {
    const deals = this.storage.get<Deal[]>(this.DEALS_KEY);
    if (deals) this.dealsSignal.set(deals);

    const funnels = this.storage.get<Funnel[]>(this.FUNNELS_KEY);
    if (funnels) this.funnelsSignal.set(funnels);
  }

  private saveDeals(): void {
    this.storage.set(this.DEALS_KEY, this.dealsSignal());
  }

  private saveFunnels(): void {
    this.storage.set(this.FUNNELS_KEY, this.funnelsSignal());
  }

  getFunnelById(id: string): Funnel | undefined {
    return this.funnelsSignal().find(f => f.id === id);
  }
}
