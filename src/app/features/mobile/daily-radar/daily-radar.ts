import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadarService } from '../../../core/services/radar.service';
import { RadarContact, RELATIONSHIP_ICONS } from '../../../core/models/radar-contact.model';
import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring';

@Component({
  selector: 'um-daily-radar',
  standalone: true,
  imports: [FormsModule, ProgressRingComponent],
  template: `
    <div class="daily-radar">
      <!-- Header -->
      <div class="radar-header animate-fadeInUp">
        <span class="radar-emoji">📡</span>
        <h1>Daily 5</h1>
        <p class="radar-subtitle">Contacta 5 personas hoy, sin excusas.</p>
      </div>

      <!-- Progress Ring -->
      <div class="progress-hero animate-fadeInUp stagger-1">
        <um-progress-ring
          [value]="radarService.dailyProgress()"
          [size]="140"
          [strokeWidth]="10"
          [color]="progressColor()"
        />
        <div class="progress-center">
          <span class="progress-count">{{ radarService.dailyContactedCount() }}</span>
          <span class="progress-of">de {{ dailyList().length }}</span>
        </div>
      </div>

      <!-- Backlog Warning -->
      @if (overdueCount() >= 5) {
        <div class="backlog-warning animate-fadeInUp">
          <span class="bw-icon">🚨</span>
          <div class="bw-text">
            <strong>Backlog lleno</strong>
            <span>Tienes {{ overdueCount() }} contactos atrasados. No recibirás nuevos hasta que los limpies.</span>
          </div>
        </div>
      }

      <!-- Contact Cards -->
      <div class="contact-list animate-fadeInUp stagger-2">
        @for (contact of dailyList(); track contact.id) {
          <div class="contact-card" [class.overdue]="contact.isOverdue" [class.completed]="contact.hasTappedContactButton">
            <!-- Status Indicator -->
            @if (contact.isOverdue && !contact.hasTappedContactButton) {
              <div class="overdue-banner">⚠️ Atrasado</div>
            }
            @if (contact.hasTappedContactButton) {
              <div class="completed-banner">✅ Contactado</div>
            }

            <!-- Contact Info -->
            <div class="contact-row">
              <div class="contact-avatar-wrap" [class.active]="contact.hasTappedContactButton">
                <span class="contact-initial">{{ contact.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="contact-info">
                <span class="contact-name">{{ contact.name }}</span>
                <span class="contact-meta">
                  {{ getTagIcon(contact.relationshipTag) }}
                  {{ contact.phone }}
                </span>
              </div>
            </div>

            <!-- Reminder Text -->
            @if (getReminder(contact)) {
              <div class="reminder-text">{{ getReminder(contact) }}</div>
            }

            <!-- Action Buttons: ONLY way to resolve -->
            @if (!contact.hasTappedContactButton) {
              <div class="action-row">
                <button class="action-btn wa-btn" (click)="contactNow(contact)">
                  <span class="action-icon">💬</span>
                  <span class="action-label">Contactar Ahora</span>
                </button>
                <button class="action-btn snooze-btn" (click)="openSnooze(contact)">
                  <span class="action-icon">⏸</span>
                  <span class="action-label">Posponer</span>
                </button>
              </div>
            }
          </div>
        }

        @if (!dailyList().length) {
          <div class="empty-state animate-fadeInUp">
            <span class="empty-emoji">🧘</span>
            <h2>Sin contactos en el radar</h2>
            <p>Agrega contactos desde la Consola de Mando para empezar a construir tu red.</p>
          </div>
        }
      </div>

      <!-- Snooze Picker Modal -->
      @if (snoozeTarget()) {
        <div class="modal-backdrop" (click)="closeSnooze()">
          <div class="snooze-modal animate-fadeInUp" (click)="$event.stopPropagation()">
            <h3>⏸ Posponer contacto</h3>
            <p class="snooze-target-name">{{ snoozeTarget()!.name }}</p>
            <p class="snooze-hint">Selecciona una fecha futura. El contacto volverá al radar ese día.</p>

            <div class="snooze-options">
              <button class="snooze-opt" (click)="snoozeFor(1)">1 semana</button>
              <button class="snooze-opt" (click)="snoozeFor(2)">2 semanas</button>
              <button class="snooze-opt" (click)="snoozeFor(4)">1 mes</button>
              <button class="snooze-opt" (click)="snoozeFor(12)">3 meses</button>
            </div>

            <label class="custom-date-label">O elige fecha exacta:</label>
            <input class="date-input" type="date" [(ngModel)]="snoozeDate" [min]="minDate()" />

            <div class="modal-actions">
              <button class="btn-cancel" (click)="closeSnooze()">Cancelar</button>
              <button class="btn-confirm" [disabled]="!snoozeDate()" (click)="confirmSnooze()">
                ⏸ Posponer
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: 'daily-radar.scss',
})
export class DailyRadarComponent {
  radarService = inject(RadarService);

  snoozeTarget = signal<(RadarContact & { isOverdue: boolean }) | null>(null);
  snoozeDate = signal('');

  dailyList = this.radarService.dailyFive;
  overdueCount = computed(() => this.radarService.overdueContacts().length);

  progressColor = computed(() => {
    const p = this.radarService.dailyProgress();
    if (p >= 80) return '#00cec9';
    if (p >= 40) return '#54a0ff';
    return '#a78bfa';
  });

  minDate = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  getTagIcon(tag: string): string {
    return RELATIONSHIP_ICONS[tag as keyof typeof RELATIONSHIP_ICONS] || '📌';
  }

  getReminder(contact: RadarContact): string | null {
    return this.radarService.getReminderForContact(contact);
  }

  /**
   * THE ONLY way to break the persistence loop.
   * Opens WhatsApp deep link and updates state.
   */
  contactNow(contact: RadarContact): void {
    const deepLink = this.radarService.triggerWhatsAppContact(contact.id);
    if (deepLink) {
      window.open(deepLink, '_blank');
    }
  }

  openSnooze(contact: RadarContact & { isOverdue: boolean }): void {
    this.snoozeTarget.set(contact);
    this.snoozeDate.set('');
  }

  closeSnooze(): void {
    this.snoozeTarget.set(null);
  }

  snoozeFor(weeks: number): void {
    const target = this.snoozeTarget();
    if (!target) return;
    const date = new Date();
    date.setDate(date.getDate() + (weeks * 7));
    this.radarService.snoozeUntilDate(target.id, date);
    this.closeSnooze();
  }

  confirmSnooze(): void {
    const target = this.snoozeTarget();
    if (!target || !this.snoozeDate()) return;
    this.radarService.snoozeUntilDate(target.id, new Date(this.snoozeDate()));
    this.closeSnooze();
  }
}
