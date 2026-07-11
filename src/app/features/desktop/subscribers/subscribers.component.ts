import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { UserService } from '../../../core/services/user.service';
import { DataSyncService } from '../../../core/services/data-sync.service';
import { Router } from '@angular/router';
import { UmIconComponent } from '../../../shared/components/um-icon/um-icon';
import { SubscriptionStatusBadgeComponent } from '../../../shared/components/subscription-status-badge/subscription-status-badge';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionPlan,
  PLAN_LABELS,
  PLAN_COLORS,
  PLAN_STORAGE_LIMITS,
  STATUS_LABELS,
} from '../../../core/models/subscription.model';

type PanelMode = 'closed' | 'create' | 'edit';

@Component({
  selector: 'um-subscribers',
  standalone: true,
  imports: [CommonModule, FormsModule, UmIconComponent, SubscriptionStatusBadgeComponent, DatePipe],
  templateUrl: './subscribers.component.html',
  styleUrl: './subscribers.scss',
})
export class SubscribersComponent {
  private subService = inject(SubscriptionService);
  private userService = inject(UserService);
  private dataSync = inject(DataSyncService);
  private router = inject(Router);

  // ─── State ────────────────────────────────
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  panelMode = signal<PanelMode>('closed');
  editingId = signal<string | null>(null);
  toast = signal('');

  // ─── Form ─────────────────────────────────
  form = signal(this.emptyForm());

  // ─── Enums for template ───────────────────
  readonly planOptions = Object.values(SubscriptionPlan);
  readonly statusOptions = Object.values(SubscriptionStatus);
  readonly planLabels = PLAN_LABELS;
  readonly planColors = PLAN_COLORS;
  readonly statusLabels = STATUS_LABELS;

  // ─── Computed ─────────────────────────────
  stats = this.subService.stats;

  filteredSubscriptions = computed(() => {
    const subs = this.subService.subscriptions();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return subs.filter(s => {
      const matchQuery = !query ||
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.plan.toLowerCase().includes(query);
      const matchStatus = status === 'all' || s.status === status;
      return matchQuery && matchStatus;
    });
  });

  constructor() {
    if (!this.userService.isSuperAdmin()) {
      this.router.navigate(['/d/dashboard']);
    }
  }

  // ─── Panel Actions ────────────────────────

  openCreate(): void {
    this.form.set(this.emptyForm());
    this.editingId.set(null);
    this.panelMode.set('create');
  }

  openEdit(sub: Subscription): void {
    this.form.set({
      name: sub.name,
      email: sub.email,
      password: '',
      plan: sub.plan,
      status: sub.status,
      startDate: sub.startDate.split('T')[0],
      endDate: sub.endDate.split('T')[0],
      storageUsedMB: sub.storageUsedMB,
      storageLimitMB: sub.storageLimitMB,
      notes: sub.notes,
    });
    this.editingId.set(sub.id);
    this.panelMode.set('edit');
  }

  closePanel(): void {
    this.panelMode.set('closed');
    this.editingId.set(null);
  }

  // ─── CRUD ─────────────────────────────────

  saveSubscription(): void {
    const f = this.form();
    if (!f.name.trim() || !f.email.trim()) return;

    if (this.panelMode() === 'edit' && this.editingId()) {
      this.subService.update(this.editingId()!, {
        name: f.name.trim(),
        email: f.email.trim(),
        plan: f.plan,
        status: f.status,
        startDate: new Date(f.startDate).toISOString(),
        endDate: new Date(f.endDate).toISOString(),
        storageUsedMB: Number(f.storageUsedMB),
        storageLimitMB: Number(f.storageLimitMB),
        notes: f.notes,
      });
      this.showToast('✅ Suscriptor actualizado');
    } else {
      // Generate a shared userId for both the subscription and the user account
      const userId = 'u-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

      // 1. Create the subscription record
      this.subService.create({
        userId,
        name: f.name.trim(),
        email: f.email.trim(),
        plan: f.plan,
        status: f.status,
        startDate: new Date(f.startDate).toISOString(),
        endDate: new Date(f.endDate).toISOString(),
        storageUsedMB: Number(f.storageUsedMB),
        storageLimitMB: PLAN_STORAGE_LIMITS[f.plan],
        modules: [],
        notes: f.notes,
        lastActivity: new Date().toISOString(),
      });

      // 2. Create the user account so the subscriber can log in
      const password = (f as any).password?.trim() || '123456';
      this.userService.createUserAccount({
        id: userId,
        name: f.name.trim(),
        email: f.email.trim(),
        password,
        role: 'user',
        isActive: true,
      });

      this.showToast('✅ Suscriptor creado con acceso');
    }

    this.closePanel();

    // Force immediate server sync so data persists across browsers
    this.dataSync.saveToServer();
  }

  toggleStatus(sub: Subscription): void {
    this.subService.toggleStatus(sub.id);
    this.showToast(`Estado cambiado: ${STATUS_LABELS[this.subService.getById(sub.id)!.status]}`);
  }

  deleteSub(sub: Subscription): void {
    if (confirm(`¿Eliminar la suscripción de "${sub.name}"? Esta acción no se puede deshacer.`)) {
      this.subService.delete(sub.id);
      this.showToast('🗑️ Suscripción eliminada');
      this.dataSync.saveToServer();
    }
  }

  // ─── Helpers ──────────────────────────────

  getAvatarInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#00b894', '#0984e3', '#6c5ce7', '#e84393', '#fdcb6e', '#e17055', '#00cec9'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getStoragePercent(used: number, limit: number): number {
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  }

  getStorageClass(percent: number): string {
    if (percent >= 90) return 'danger';
    if (percent >= 70) return 'warn';
    return '';
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return iso; }
  }

  isFormValid(): boolean {
    const f = this.form();
    return !!(f.name?.trim() && f.email?.trim() && f.startDate && f.endDate);
  }

  private emptyForm() {
    return {
      name: '',
      email: '',
      password: '',
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.TRIAL,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      storageUsedMB: 0,
      storageLimitMB: PLAN_STORAGE_LIMITS[SubscriptionPlan.FREE],
      notes: '',
    };
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
