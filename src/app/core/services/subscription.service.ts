import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionPlan,
  PLAN_STORAGE_LIMITS,
} from '../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private storage = inject(StorageService);
  private readonly KEY = 'um_subscriptions';

  /** Reactive list of all subscriptions */
  subscriptions = signal<Subscription[]>(this.loadAll());

  // ─── Computed Stats ────────────────────────────

  stats = computed(() => {
    const subs = this.subscriptions();
    const active = subs.filter(s => s.status === SubscriptionStatus.ACTIVE).length;
    const trial = subs.filter(s => s.status === SubscriptionStatus.TRIAL).length;
    const expired = subs.filter(s => s.status === SubscriptionStatus.EXPIRED).length;
    const suspended = subs.filter(s => s.status === SubscriptionStatus.SUSPENDED).length;
    const totalStorageUsed = subs.reduce((sum, s) => sum + (s.storageUsedMB || 0), 0);
    const totalStorageLimit = subs.reduce((sum, s) => sum + (s.storageLimitMB || 0), 0);

    // Subscriptions expiring within the next 30 days
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringsSoon = subs.filter(s => {
      if (s.status !== SubscriptionStatus.ACTIVE) return false;
      const end = new Date(s.endDate);
      return end >= now && end <= in30Days;
    }).length;

    return {
      total: subs.length,
      active,
      trial,
      expired,
      suspended,
      totalStorageUsed,
      totalStorageLimit,
      expiringsSoon,
    };
  });

  constructor() {
    this.seedIfEmpty();
    this.ensureSeededSubscriptions();
  }

  /**
   * Ensure hardcoded subscriber entries always exist in the subscriptions list.
   * This survives clearing browser history / localStorage.
   * Remove these seeds once MongoDB is in production.
   */
  private ensureSeededSubscriptions(): void {
    const SEEDED: Omit<Subscription, 'id' | 'createdAt'>[] = [
      {
        userId: 'u-seed-fabianferna',
        name: 'Fabian Fernando Pineda Acosta',
        email: 'fabianfernandopinedaacosta@gmail.com',
        plan: SubscriptionPlan.BASIC,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        storageUsedMB: 0,
        storageLimitMB: PLAN_STORAGE_LIMITS[SubscriptionPlan.BASIC],
        modules: ['clinica', 'agenda', 'tests', 'formularios'],
        notes: 'Cuenta semilla (hardcoded). Contraseña: 123456',
        lastActivity: new Date().toISOString(),
      },
    ];

    const current = this.subscriptions();
    for (const seed of SEEDED) {
      const exists = current.some(
        s => s.email.toLowerCase() === seed.email.toLowerCase()
      );
      if (!exists) {
        this.create(seed);
        console.log(`[SubscriptionService] Seeded subscription: ${seed.email}`);
      }
    }
  }

  // ─── CRUD Operations ──────────────────────────

  getAll(): Subscription[] {
    return this.subscriptions();
  }

  getById(id: string): Subscription | undefined {
    return this.subscriptions().find(s => s.id === id);
  }

  create(data: Omit<Subscription, 'id' | 'createdAt'>): Subscription {
    const sub: Subscription = {
      ...data,
      id: 'sub-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    const updated = [...this.subscriptions(), sub];
    this.persist(updated);
    return sub;
  }

  update(id: string, changes: Partial<Subscription>): void {
    const list = this.subscriptions().map(s =>
      s.id === id ? { ...s, ...changes } : s
    );
    this.persist(list);
  }

  delete(id: string): void {
    const list = this.subscriptions().filter(s => s.id !== id);
    this.persist(list);
  }

  toggleStatus(id: string): void {
    const sub = this.getById(id);
    if (!sub) return;
    const nextStatus: Record<SubscriptionStatus, SubscriptionStatus> = {
      [SubscriptionStatus.ACTIVE]: SubscriptionStatus.SUSPENDED,
      [SubscriptionStatus.SUSPENDED]: SubscriptionStatus.ACTIVE,
      [SubscriptionStatus.EXPIRED]: SubscriptionStatus.ACTIVE,
      [SubscriptionStatus.TRIAL]: SubscriptionStatus.ACTIVE,
    };
    this.update(id, { status: nextStatus[sub.status] });
  }

  // ─── Internal ─────────────────────────────────

  private loadAll(): Subscription[] {
    return this.storage.get<Subscription[]>(this.KEY) || [];
  }

  private persist(list: Subscription[]): void {
    this.storage.set(this.KEY, list);
    this.subscriptions.set(list);
  }

  /** Seed demo data only if no subscriptions exist */
  private seedIfEmpty(): void {
    if (this.subscriptions().length > 0) return;

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const seeds: Omit<Subscription, 'id' | 'createdAt'>[] = [
      {
        userId: 'demo-u1',
        name: 'Dr. María López',
        email: 'maria.lopez@clinicamental.com',
        plan: SubscriptionPlan.PROFESSIONAL,
        status: SubscriptionStatus.ACTIVE,
        startDate: sixMonthsAgo.toISOString(),
        endDate: oneYearLater.toISOString(),
        storageUsedMB: 847,
        storageLimitMB: PLAN_STORAGE_LIMITS[SubscriptionPlan.PROFESSIONAL],
        modules: ['clinica', 'agenda', 'tests', 'resultados', 'analytics'],
        notes: 'Cliente premium. Especialista en psicología clínica.',
        lastActivity: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        userId: 'demo-u2',
        name: 'Carlos Mendoza',
        email: 'cmendoza@psicologia.edu.co',
        plan: SubscriptionPlan.BASIC,
        status: SubscriptionStatus.ACTIVE,
        startDate: oneMonthAgo.toISOString(),
        endDate: threeMonthsLater.toISOString(),
        storageUsedMB: 120,
        storageLimitMB: PLAN_STORAGE_LIMITS[SubscriptionPlan.BASIC],
        modules: ['tests', 'formularios', 'datos'],
        notes: 'Docente universitario. Uso académico.',
        lastActivity: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        userId: 'demo-u3',
        name: 'Ana García Vega',
        email: 'ana.garcia@bienestar.org',
        plan: SubscriptionPlan.ENTERPRISE,
        status: SubscriptionStatus.ACTIVE,
        startDate: sixMonthsAgo.toISOString(),
        endDate: twoWeeksLater.toISOString(),
        storageUsedMB: 4320,
        storageLimitMB: PLAN_STORAGE_LIMITS[SubscriptionPlan.ENTERPRISE],
        modules: ['clinica', 'agenda', 'tests', 'formularios', 'datos', 'resultados', 'analytics', 'entrenamientos', 'simulador'],
        notes: 'Organización corporativa. 50+ usuarios. Próxima renovación.',
        lastActivity: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        userId: 'demo-u4',
        name: 'Pedro Jiménez',
        email: 'pedro.j@consultorio.co',
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.TRIAL,
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        storageUsedMB: 15,
        storageLimitMB: PLAN_STORAGE_LIMITS[SubscriptionPlan.FREE],
        modules: ['tests', 'formularios'],
        notes: 'En periodo de prueba. Interesado en plan Profesional.',
        lastActivity: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        userId: 'demo-u5',
        name: 'Dra. Laura Martínez',
        email: 'l.martinez@neuro.com',
        plan: SubscriptionPlan.PROFESSIONAL,
        status: SubscriptionStatus.EXPIRED,
        startDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        storageUsedMB: 1560,
        storageLimitMB: PLAN_STORAGE_LIMITS[SubscriptionPlan.PROFESSIONAL],
        modules: ['clinica', 'tests', 'resultados'],
        notes: 'Suscripción expirada. Contactar para renovación.',
        lastActivity: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    seeds.forEach(s => this.create(s));
  }
}
