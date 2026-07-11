import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';
import { PersonalizationService } from '../../../core/services/personalization.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dash-page">

      <!-- ═══ Greeting Banner ═══ -->
      <section class="dash-greeting">
        <div>
          <h1 class="dash-hello">{{ greetingText() }}</h1>
          <p class="dash-date">{{ formattedDate }}</p>
        </div>
        @if (pz.preferences().showWelcomeMessage && pz.preferences().welcomeMessage) {
          <span class="dash-affirmation">{{ pz.preferences().welcomeMessage }}</span>
        }
      </section>

      <!-- ═══ Overview KPIs ═══ -->
      <section class="dash-kpis">
        <div class="kpi-card">
          <div class="kpi-icon sage">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">{{ totalClients() }}</span>
            <span class="kpi-label">{{ clientPlural() }} activos</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon rose">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">{{ todayAppointments() }}</span>
            <span class="kpi-label">Citas hoy</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon blue">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">{{ weekSessions() }}</span>
            <span class="kpi-label">Sesiones esta semana</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon lavender">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">{{ completionRate() }}%</span>
            <span class="kpi-label">Asistencia</span>
          </div>
        </div>
      </section>

      <!-- ═══ Main Content Grid ═══ -->
      <div class="dash-grid">

        <!-- Citas de Hoy -->
        <section class="dash-card dash-today">
          <div class="card-header">
            <h2>Citas de Hoy</h2>
            <a class="card-link" routerLink="/d/agenda">Ver agenda →</a>
          </div>
          @if (todayAppts().length > 0) {
            <div class="appt-list">
              @for (appt of todayAppts(); track appt.id) {
                <div class="appt-row">
                  <div class="appt-time-block">
                    <span class="appt-start">{{ appt.startTime }}</span>
                    <span class="appt-end">{{ appt.endTime }}</span>
                  </div>
                  <div class="appt-dot" [style.background]="getTypeColor(appt.type)"></div>
                  <div class="appt-detail">
                    <span class="appt-name">{{ appt.clientName }}</span>
                    <span class="appt-meta">{{ getTypeLabel(appt.type) }}</span>
                  </div>
                  <span class="appt-status" [class]="'st-' + appt.status">{{ formatStatus(appt.status) }}</span>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <span class="empty-icon">☀️</span>
              <p>Sin citas programadas para hoy</p>
              <a class="empty-btn" routerLink="/d/agenda">Agendar cita</a>
            </div>
          }
        </section>

        <!-- Acceso Rápido -->
        <section class="dash-card dash-quick">
          <div class="card-header">
            <h2>Accesos Rápidos</h2>
          </div>
          <div class="quick-grid">
            <a class="quick-item" routerLink="/d/agenda">
              <div class="quick-icon sage">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <span>Agenda</span>
            </a>
            <a class="quick-item" routerLink="/d/clinica">
              <div class="quick-icon rose">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              </div>
              <span>{{ clientPlural() }}</span>
            </a>
            <a class="quick-item" routerLink="/d/simulador">
              <div class="quick-icon blue">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path><path d="M7 13s1.5-2 5-2 5 2 5 2"></path></svg>
              </div>
              <span>Simulador</span>
            </a>
            <a class="quick-item" routerLink="/d/tests">
              <div class="quick-icon lavender">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3h6"></path><path d="M10 3v6.5L4 18a1 1 0 0 0 .87 1.5h14.26A1 1 0 0 0 20 18l-6-8.5V3"></path></svg>
              </div>
              <span>Tests</span>
            </a>
            <a class="quick-item" routerLink="/d/admin-formularios">
              <div class="quick-icon earth">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              </div>
              <span>Formularios</span>
            </a>
            <a class="quick-item" routerLink="/d/personalizar">
              <div class="quick-icon neutral">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </div>
              <span>Personalizar</span>
            </a>
          </div>
        </section>

        <!-- Próximas Citas -->
        <section class="dash-card dash-upcoming">
          <div class="card-header">
            <h2>Próximas Citas</h2>
            <span class="card-badge">Esta semana</span>
          </div>
          @if (upcomingAppts().length > 0) {
            <div class="upcoming-list">
              @for (appt of upcomingAppts(); track appt.id) {
                <div class="upcoming-row">
                  <div class="upcoming-date">
                    <span class="upcoming-day">{{ getDayName(appt.date) }}</span>
                    <span class="upcoming-num">{{ getDayNum(appt.date) }}</span>
                  </div>
                  <div class="upcoming-info">
                    <span class="upcoming-name">{{ appt.clientName }}</span>
                    <span class="upcoming-time">{{ appt.startTime }} - {{ appt.endTime }} · {{ getTypeLabel(appt.type) }}</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state small">
              <p>No hay citas programadas para esta semana</p>
            </div>
          }
        </section>

        <!-- Notas Rápidas -->
        <section class="dash-card dash-notes">
          <div class="card-header">
            <h2>Nota Rápida del Día</h2>
          </div>
          <textarea
            class="note-area"
            placeholder="Escribe recordatorios, reflexiones o notas del día..."
            [value]="dailyNote()"
            (input)="saveDailyNote($event)"
          ></textarea>
        </section>

      </div>
    </div>
  `,
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private storage = inject(StorageService);
  pz = inject(PersonalizationService);
  today = new Date();
  formattedDate = this.today.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  clientPlural = this.pz.clientPlural;

  // ─── Data signals ────────────
  appointments = signal<any[]>([]);
  dailyNote = signal('');

  // ─── Computed KPIs ───────────
  totalClients = computed(() => {
    const clients = this.storage.get<any[]>('pd_clients') || [];
    return clients.length;
  });

  todayStr = new Date().toISOString().split('T')[0];

  todayAppointments = computed(() => this.todayAppts().length);

  todayAppts = computed(() => {
    return this.appointments()
      .filter((a: any) => a.date === this.todayStr)
      .sort((a: any, b: any) => (a.startTime || '').localeCompare(b.startTime || ''));
  });

  weekSessions = computed(() => {
    const now = new Date();
    const monday = this.getMonday(now);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);
    const startStr = monday.toISOString().split('T')[0];
    const endStr = sunday.toISOString().split('T')[0];
    return this.appointments().filter((a: any) => a.date >= startStr && a.date < endStr).length;
  });

  completionRate = computed(() => {
    const all = this.appointments();
    if (all.length === 0) return 100;
    const completed = all.filter((a: any) => a.status === 'completada' || a.status === 'confirmada').length;
    return Math.round((completed / all.length) * 100);
  });

  upcomingAppts = computed(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const endWeek = new Date();
    endWeek.setDate(endWeek.getDate() + 7);
    const endStr = endWeek.toISOString().split('T')[0];
    return this.appointments()
      .filter((a: any) => a.date >= tomorrowStr && a.date <= endStr)
      .sort((a: any, b: any) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  });

  greetingText = computed(() => {
    const h = new Date().getHours();
    const name = this.pz.preferences().practiceName;
    const prefix = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
    return name ? `${prefix}, ${name}` : prefix;
  });

  ngOnInit() {
    this.appointments.set(this.storage.get<any[]>('pd_appointments') || []);
    const noteKey = `pd_note_${this.todayStr}`;
    this.dailyNote.set(this.storage.get<string>(noteKey) || '');
  }

  saveDailyNote(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.dailyNote.set(val);
    this.storage.set(`pd_note_${this.todayStr}`, val);
  }

  // ─── Helpers ──────────────
  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      individual: '#084983', pareja: '#8B7EB8', grupal: '#5B8A9A',
      evaluacion: '#009fe3', seguimiento: '#C4919B'
    };
    return map[type] || '#084983';
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      individual: 'Individual', pareja: 'Pareja', grupal: 'Grupal',
      evaluacion: 'Evaluación', seguimiento: 'Seguimiento'
    };
    return map[type] || type;
  }

  formatStatus(s: string): string {
    const map: Record<string, string> = {
      programada: 'Programada', confirmada: 'Confirmada',
      completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No asistió'
    };
    return map[s] || s;
  }

  getDayName(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es', { weekday: 'short' });
  }

  getDayNum(dateStr: string): number {
    return new Date(dateStr + 'T12:00:00').getDate();
  }

  private getMonday(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  }
}
