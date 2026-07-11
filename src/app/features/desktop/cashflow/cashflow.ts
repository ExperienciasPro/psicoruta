import { Component, inject, signal } from '@angular/core';
import { CashflowService } from '../../../core/services/cashflow.service';
import {
  TransactionType,
  TransactionCategory,
  CATEGORY_LABELS,
  INGRESO_CATEGORIES,
  EGRESO_CATEGORIES,
} from '../../../core/models/cashflow.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'um-cashflow',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="cashflow-page">

      <!-- ═══ Header ═══ -->
      <header class="page-header">
        <div class="header-top">
          <div>
            <h1>Flujo de Caja</h1>
            <p class="header-subtitle">Lo que entra y lo que sale, simple y claro.</p>
          </div>
          <button class="btn-add" (click)="showForm.set(!showForm())">
            {{ showForm() ? '✕ Cerrar' : '+ Registrar movimiento' }}
          </button>
        </div>

        <!-- Month Nav -->
        <div class="month-nav">
          <button class="month-arrow" (click)="cf.goToPreviousMonth()">‹</button>
          <span class="month-label">{{ getMonthLabel() }}</span>
          <button class="month-arrow" (click)="cf.goToNextMonth()">›</button>
        </div>
      </header>

      <!-- ═══ Summary Cards ═══ -->
      <div class="summary-row">
        <div class="summary-card ingreso">
          <span class="summary-icon">↗</span>
          <div>
            <p class="summary-label">Ingresos</p>
            <p class="summary-value">{{ cf.summary().totalIngresos | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
          </div>
        </div>
        <div class="summary-card egreso">
          <span class="summary-icon">↙</span>
          <div>
            <p class="summary-label">Egresos</p>
            <p class="summary-value">{{ cf.summary().totalEgresos | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
          </div>
        </div>
        <div class="summary-card balance" [class.positive]="cf.summary().balance >= 0" [class.negative]="cf.summary().balance < 0">
          <span class="summary-icon">⚖</span>
          <div>
            <p class="summary-label">Balance</p>
            <p class="summary-value">{{ cf.summary().balance | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
          </div>
        </div>
      </div>

      <!-- ═══ Quick Add Form ═══ -->
      @if (showForm()) {
        <div class="form-panel">
          <h3>Nuevo movimiento</h3>

          <!-- Type toggle -->
          <div class="type-toggle">
            <button
              class="toggle-btn"
              [class.active]="formType() === 'ingreso'"
              (click)="formType.set('ingreso')">
              ↗ Ingreso
            </button>
            <button
              class="toggle-btn"
              [class.active]="formType() === 'egreso'"
              (click)="formType.set('egreso')">
              ↙ Egreso
            </button>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Descripción</label>
              <input type="text" [(ngModel)]="formDesc" placeholder="Ej: Pago cliente Acme" />
            </div>
            <div class="form-field">
              <label>Monto (COP)</label>
              <input type="number" [(ngModel)]="formAmount" placeholder="0" min="0" />
            </div>
            <div class="form-field">
              <label>Categoría</label>
              <select [(ngModel)]="formCategory">
                @for (cat of getCategories(); track cat) {
                  <option [value]="cat">{{ getCategoryLabel(cat) }}</option>
                }
              </select>
            </div>
            <div class="form-field">
              <label>Fecha</label>
              <input type="date" [(ngModel)]="formDate" />
            </div>
          </div>

          <div class="form-field notes-field">
            <label>Notas (opcional)</label>
            <textarea [(ngModel)]="formNotes" rows="2" placeholder="Detalle adicional..."></textarea>
          </div>

          <button class="btn-save" [disabled]="!canSave()" (click)="save()">
            Guardar {{ formType() === 'ingreso' ? 'ingreso' : 'egreso' }}
          </button>
        </div>
      }

      <!-- ═══ Transaction List ═══ -->
      <div class="tx-list">
        <div class="tx-list-header">
          <h2>Movimientos ({{ cf.monthTransactions().length }})</h2>
          <div class="filter-tabs">
            <button [class.active]="filterType() === 'all'" (click)="filterType.set('all')">Todos</button>
            <button [class.active]="filterType() === 'ingreso'" (click)="filterType.set('ingreso')">Ingresos</button>
            <button [class.active]="filterType() === 'egreso'" (click)="filterType.set('egreso')">Egresos</button>
          </div>
        </div>

        @if (filteredTransactions().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>No hay movimientos {{ filterType() !== 'all' ? 'de este tipo ' : '' }}en este mes.</p>
            <p class="empty-hint">Toca "+ Registrar movimiento" para empezar.</p>
          </div>
        }

        @for (tx of filteredTransactions(); track tx.id) {
          <div class="tx-row" [class.ingreso]="tx.type === 'ingreso'" [class.egreso]="tx.type === 'egreso'">
            <div class="tx-indicator">
              <span>{{ tx.type === 'ingreso' ? '↗' : '↙' }}</span>
            </div>
            <div class="tx-info">
              <p class="tx-desc">{{ tx.description }}</p>
              <p class="tx-meta">{{ getCategoryLabel(tx.category) }} · {{ tx.date | date:'d MMM' }}</p>
            </div>
            <div class="tx-amount" [class.positive]="tx.type === 'ingreso'" [class.negative]="tx.type === 'egreso'">
              {{ tx.type === 'ingreso' ? '+' : '-' }}{{ tx.amount | currency:'COP':'symbol-narrow':'1.0-0' }}
            </div>
            <button class="tx-delete" (click)="cf.remove(tx.id)" title="Eliminar">✕</button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: 'cashflow.scss',
})
export class CashflowComponent {
  cf = inject(CashflowService);

  showForm = signal(false);
  formType = signal<TransactionType>('ingreso');
  formDesc = '';
  formAmount: number | null = null;
  formCategory: TransactionCategory = 'ventas';
  formDate = new Date().toISOString().split('T')[0];
  formNotes = '';
  filterType = signal<'all' | TransactionType>('all');

  filteredTransactions = () => {
    const type = this.filterType();
    const txs = this.cf.monthTransactions();
    if (type === 'all') return txs;
    return txs.filter(t => t.type === type);
  };

  getMonthLabel(): string {
    const [y, m] = this.cf.activeMonth().split('-').map(Number);
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return `${months[m - 1]} ${y}`;
  }

  getCategories(): TransactionCategory[] {
    return this.formType() === 'ingreso' ? INGRESO_CATEGORIES : EGRESO_CATEGORIES;
  }

  getCategoryLabel(cat: TransactionCategory): string {
    return CATEGORY_LABELS[cat] || cat;
  }

  canSave(): boolean {
    return !!(this.formDesc.trim() && this.formAmount && this.formAmount > 0 && this.formDate);
  }

  save(): void {
    if (!this.canSave()) return;
    this.cf.add({
      type: this.formType(),
      category: this.formCategory,
      description: this.formDesc.trim(),
      amount: this.formAmount!,
      date: this.formDate,
      notes: this.formNotes.trim() || undefined,
    });
    // Reset
    this.formDesc = '';
    this.formAmount = null;
    this.formNotes = '';
    this.showForm.set(false);
  }
}
