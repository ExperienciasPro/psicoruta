import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

export interface Product {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly STORAGE_KEY = 'um_inventory';
  private productsSignal = signal<Product[]>([]);

  readonly products = this.productsSignal.asReadonly();

  readonly criticalProducts = computed(() =>
    this.productsSignal().filter(p => p.stock <= p.minStock)
  );

  readonly stats = computed(() => ({
    totalProducts: this.productsSignal().length,
    criticalCount: this.criticalProducts().length,
    totalValue: this.productsSignal().reduce((s, p) => s + p.stock * p.price, 0),
  }));

  constructor(private storage: StorageService) {
    const data = this.storage.get<Product[]>(this.STORAGE_KEY);
    if (data) this.productsSignal.set(data);
  }
}
