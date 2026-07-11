import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';
import { PersonalizationService } from '../../../core/services/personalization.service';
import { ClinicaService } from '../../../core/services/clinica.service';
import { Patient } from '../../../core/models/clinica.model';

interface Appointment {
  id: string;
  patientId: string;
  clientName: string;
  date: string;       // ISO date
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  type: 'individual' | 'pareja' | 'grupal' | 'evaluacion' | 'seguimiento';
  notes: string;
  status: 'programada' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  color?: string;
}

const APPOINTMENT_TYPES: { id: string; label: string; color: string }[] = [
  { id: 'individual', label: 'Individual', color: '#084983' },
  { id: 'pareja', label: 'Pareja', color: '#8B7EB8' },
  { id: 'grupal', label: 'Grupal', color: '#5B8A9A' },
  { id: 'evaluacion', label: 'Evaluación', color: '#009fe3' },
  { id: 'seguimiento', label: 'Seguimiento', color: '#C4919B' },
];

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="agenda-page">

      <!-- Header -->
      <header class="ag-header">
        <div>
          <h1 class="ag-title">Agenda</h1>
          <p class="ag-subtitle">Gestiona tus citas y sesiones con {{ clientPlural() }}</p>
        </div>
        <div class="ag-header-actions">
          <div class="ag-view-toggle">
            <button class="ag-view-btn" [class.active]="view() === 'month'" (click)="view.set('month')">Mes</button>
            <button class="ag-view-btn" [class.active]="view() === 'week'" (click)="view.set('week')">Semana</button>
            <button class="ag-view-btn" [class.active]="view() === 'day'" (click)="view.set('day')">Día</button>
            <button class="ag-view-btn" [class.active]="view() === 'list'" (click)="view.set('list')">Lista</button>
          </div>
          <button class="ag-btn-new" (click)="openNewAppointment()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nueva Cita
          </button>
        </div>
      </header>

      <!-- Navigation de fechas -->
      <div class="ag-date-nav">
        <button class="ag-nav-btn" (click)="navPrev()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <h2 class="ag-date-label">{{ dateLabel() }}</h2>
        <button class="ag-nav-btn" (click)="navNext()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        <button class="ag-today-btn" (click)="goToday()">Hoy</button>
      </div>

      <!-- Vista Semana -->
      @if (view() === 'week' || view() === 'day') {
        <div class="ag-week-grid" [class.single-day]="view() === 'day'">
          @for (day of visibleDays(); track day.dateStr) {
            <div class="ag-day-col" [class.today]="day.isToday">
              <div class="ag-day-header">
                <span class="ag-day-name">{{ day.dayName }}</span>
                <span class="ag-day-num" [class.today-num]="day.isToday">{{ day.dayNum }}</span>
              </div>
              <div class="ag-day-body">
                @for (appt of getAppointmentsForDay(day.dateStr); track appt.id) {
                  <div class="ag-appt-card" [style.border-left-color]="getTypeColor(appt.type)" (click)="editAppointment(appt)">
                    <span class="ag-appt-time">{{ appt.startTime }} - {{ appt.endTime }}</span>
                    <span class="ag-appt-name">{{ appt.clientName }}</span>
                    <span class="ag-appt-type">{{ getTypeLabel(appt.type) }}</span>
                    <span class="ag-appt-status" [class]="'status-' + appt.status">{{ formatStatus(appt.status) }}</span>
                  </div>
                }
                @if (getAppointmentsForDay(day.dateStr).length === 0) {
                  <div class="ag-day-empty">Sin citas</div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Vista Mes -->
      @if (view() === 'month') {
        <div class="ag-month-grid">
          <div class="ag-month-header">
            @for (dn of monthDayNames; track dn) {
              <div class="ag-month-hdr">{{ dn }}</div>
            }
          </div>
          <div class="ag-month-body">
            @for (cell of monthDays(); track cell.dateStr) {
              <div class="ag-month-cell" [class.other-month]="!cell.currentMonth" [class.today]="cell.isToday" (click)="onMonthDayClick(cell.dateStr)">
                <span class="ag-month-day-num">{{ cell.dayNum }}</span>
                @for (appt of getAppointmentsForDay(cell.dateStr).slice(0, 2); track appt.id) {
                  <div class="ag-month-appt" [style.background]="getTypeColor(appt.type) + '20'" [style.color]="getTypeColor(appt.type)">
                    {{ appt.startTime }} {{ appt.clientName }}
                  </div>
                }
                @if (getAppointmentsForDay(cell.dateStr).length > 2) {
                  <span class="ag-month-more">+{{ getAppointmentsForDay(cell.dateStr).length - 2 }} más</span>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Vista Lista -->
      @if (view() === 'list') {
        <div class="ag-list">
          @for (appt of sortedAppointments(); track appt.id) {
            <div class="ag-list-item" (click)="editAppointment(appt)">
              <div class="ag-list-dot" [style.background]="getTypeColor(appt.type)"></div>
              <div class="ag-list-date">
                <span class="ag-list-day">{{ appt.date | date:'EEE dd' }}</span>
                <span class="ag-list-time">{{ appt.startTime }}</span>
              </div>
              <div class="ag-list-info">
                <span class="ag-list-name">{{ appt.clientName }}</span>
                <span class="ag-list-type">{{ getTypeLabel(appt.type) }} · {{ appt.endTime }}</span>
              </div>
              <span class="ag-list-status" [class]="'status-' + appt.status">{{ formatStatus(appt.status) }}</span>
              <button class="ag-list-delete" (click)="deleteAppointment(appt.id); $event.stopPropagation()">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          }
          @if (sortedAppointments().length === 0) {
            <div class="ag-empty">
              <div class="ag-empty-icon">📅</div>
              <h3>Sin citas esta semana</h3>
              <p>Agenda tu primera cita con un {{ clientSingular() }}</p>
              <button class="ag-btn-new" (click)="openNewAppointment()">Crear Cita</button>
            </div>
          }
        </div>
      }

      <!-- ═══ Modal Nueva/Editar Cita ═══ -->
      @if (showModal()) {
        <div class="ag-modal-backdrop" (click)="closeModal()"></div>
        <div class="ag-modal">
          <div class="ag-modal-header">
            <h3>{{ editingId() ? 'Editar Cita' : 'Nueva Cita' }}</h3>
            <button class="ag-modal-close" (click)="closeModal()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="ag-modal-body">

            <!-- Patient Selector -->
            <div class="ag-field">
              <label>{{ clientSingular() }}</label>
              <div class="ag-patient-selector">
                <div class="ag-search-input-wrap">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text"
                    [(ngModel)]="patientSearchQuery"
                    (focus)="showPatientDropdown = true"
                    (input)="showPatientDropdown = true"
                    [placeholder]="formData.patientId ? formData.clientName : 'Buscar ' + clientSingular().toLowerCase() + '...'"
                    autocomplete="off">
                  @if (formData.patientId) {
                    <button class="ag-clear-btn" (click)="clearPatientSelection(); $event.stopPropagation()" title="Limpiar">✕</button>
                  }
                </div>
                @if (showPatientDropdown && filteredPatients().length > 0) {
                  <div class="ag-patient-dropdown">
                    @for (p of filteredPatients(); track p.id) {
                      <div class="ag-patient-option" (mousedown)="selectPatient(p)">
                        <div class="ag-patient-avatar">{{ getInitials(p) }}</div>
                        <div class="ag-patient-opt-info">
                          <span class="ag-patient-opt-name">{{ p.firstName }} {{ p.lastName }}</span>
                          <span class="ag-patient-opt-meta">{{ p.phone || p.email || 'Sin contacto' }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
                @if (showPatientDropdown && filteredPatients().length === 0 && patientSearchQuery.length > 0) {
                  <div class="ag-patient-dropdown">
                    <div class="ag-patient-no-results">
                      No se encontraron {{ clientPlural().toLowerCase() }}
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Patient History Panel (when patient is selected) -->
            @if (formData.patientId && selectedPatientHistory().length > 0) {
              <div class="ag-patient-history">
                <div class="ag-history-title">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Historial de citas ({{ selectedPatientHistory().length }})
                </div>
                <div class="ag-history-items">
                  @for (h of selectedPatientHistory().slice(0, 5); track h.id) {
                    <div class="ag-history-item">
                      <span class="ag-history-date">{{ h.date | date:'d MMM yyyy' }}</span>
                      <span class="ag-history-type" [style.color]="getTypeColor(h.type)">{{ getTypeLabel(h.type) }}</span>
                      <span class="ag-history-status" [class]="'status-' + h.status">{{ formatStatus(h.status) }}</span>
                    </div>
                  }
                  @if (selectedPatientHistory().length > 5) {
                    <div class="ag-history-more">+{{ selectedPatientHistory().length - 5 }} citas anteriores</div>
                  }
                </div>
              </div>
            }

            <div class="ag-field-row">
              <div class="ag-field">
                <label>Fecha</label>
                <input type="date" [(ngModel)]="formData.date">
              </div>
              <div class="ag-field">
                <label>Hora inicio</label>
                <input type="time" [(ngModel)]="formData.startTime">
              </div>
              <div class="ag-field">
                <label>Hora fin</label>
                <input type="time" [(ngModel)]="formData.endTime">
              </div>
            </div>
            <div class="ag-field">
              <label>Tipo de sesión</label>
              <div class="ag-type-chips">
                @for (t of appointmentTypes; track t.id) {
                  <button class="ag-type-chip" [class.selected]="formData.type === t.id" [style.--chip-color]="t.color" (click)="formData.type = t.id">
                    {{ t.label }}
                  </button>
                }
              </div>
            </div>
            <div class="ag-field">
              <label>Estado</label>
              <select [(ngModel)]="formData.status">
                <option value="programada">Programada</option>
                <option value="confirmada">Confirmada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
                <option value="no_asistio">No asistió</option>
              </select>
            </div>
            <div class="ag-field">
              <label>Notas</label>
              <textarea [(ngModel)]="formData.notes" rows="3" placeholder="Notas de la sesión..."></textarea>
            </div>

            <!-- Action: Create follow-up note when confirmed/completed -->
            @if (editingId() && (formData.status === 'confirmada' || formData.status === 'completada') && formData.patientId) {
              <div class="ag-followup-action">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                <div class="ag-followup-text">
                  <span>Crear nota de seguimiento</span>
                  <small>Se abrirá el expediente del {{ clientSingular().toLowerCase() }} para registrar la nota</small>
                </div>
                <button class="ag-followup-btn" (click)="goToFollowUpNote()">Ir a Nota →</button>
              </div>
            }
          </div>
          <div class="ag-modal-footer">
            <button class="ag-btn-cancel" (click)="closeModal()">Cancelar</button>
            <button class="ag-btn-save" (click)="saveAppointment()" [disabled]="!formData.clientName || !formData.date">
              {{ editingId() ? 'Actualizar' : 'Crear Cita' }}
            </button>
          </div>
        </div>
      }

    </div>
  `,
  styleUrl: './agenda.component.scss'
})
export class AgendaComponent {
  private storage = inject(StorageService);
  private pz = inject(PersonalizationService);
  private clinicaService = inject(ClinicaService);
  private router = inject(Router);
  private readonly KEY = 'pd_appointments';

  clientSingular = this.pz.clientSingular;
  clientPlural = this.pz.clientPlural;

  view = signal<'week' | 'day' | 'list' | 'month'>('week');
  currentMonth = signal(new Date());
  monthDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  showModal = signal(false);
  editingId = signal<string | null>(null);
  currentWeekStart = signal(this.getMonday(new Date()));

  appointments = signal<Appointment[]>(this.loadAppointments());
  appointmentTypes = APPOINTMENT_TYPES;

  formData: any = this.freshForm();
  patientSearchQuery = '';
  showPatientDropdown = false;

  // ─── Computed ──────────────
  filteredPatients = computed(() => {
    const q = this.patientSearchQuery.toLowerCase().trim();
    const all = this.clinicaService.activePatients();
    if (!q) return all;
    return all.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  selectedPatientHistory = computed(() => {
    const pid = this.formData.patientId;
    if (!pid) return [];
    return this.appointments()
      .filter(a => a.patientId === pid)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  dateLabel = computed(() => {
    if (this.view() === 'month') {
      const m = this.currentMonth();
      return m.toLocaleDateString('es', { month: 'long', year: 'numeric' });
    }
    const start = this.currentWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('es', opts)} — ${end.toLocaleDateString('es', opts)}, ${end.getFullYear()}`;
  });

  monthDays = computed(() => {
    const m = this.currentMonth();
    const year = m.getFullYear();
    const month = m.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: { dateStr: string; dayNum: number; currentMonth: boolean; isToday: boolean }[] = [];
    const today = new Date();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ dateStr: d.toISOString().split('T')[0], dayNum: d.getDate(), currentMonth: false, isToday: d.toDateString() === today.toDateString() });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dt = new Date(year, month, d);
      cells.push({ dateStr: dt.toISOString().split('T')[0], dayNum: d, currentMonth: true, isToday: dt.toDateString() === today.toDateString() });
    }
    while (cells.length < 42) {
      const d = new Date(year, month + 1, cells.length - startOffset - lastDay.getDate() + 1);
      cells.push({ dateStr: d.toISOString().split('T')[0], dayNum: d.getDate(), currentMonth: false, isToday: d.toDateString() === today.toDateString() });
    }
    return cells;
  });

  visibleDays = computed(() => {
    const start = this.currentWeekStart();
    const count = this.view() === 'day' ? 1 : 7;
    const days = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      if (this.view() === 'day') {
        d.setTime(new Date().getTime());
      } else {
        d.setDate(d.getDate() + i);
      }
      const today = new Date();
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('es', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: d.toDateString() === today.toDateString(),
      });
    }
    return days;
  });

  sortedAppointments = computed(() => {
    const start = this.currentWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    return this.appointments()
      .filter(a => a.date >= startStr && a.date < endStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  });

  // ─── Patient Selection ─────
  selectPatient(p: Patient): void {
    this.formData.patientId = p.id;
    this.formData.clientName = `${p.firstName} ${p.lastName}`;
    this.patientSearchQuery = `${p.firstName} ${p.lastName}`;
    this.showPatientDropdown = false;
  }

  clearPatientSelection(): void {
    this.formData.patientId = '';
    this.formData.clientName = '';
    this.patientSearchQuery = '';
  }

  getInitials(p: Patient): string {
    return (p.firstName?.[0] || '') + (p.lastName?.[0] || '');
  }

  goToFollowUpNote(): void {
    this.closeModal();
    this.router.navigate(['/d/clinica'], {
      queryParams: { patientId: this.formData.patientId, action: 'new-note' }
    });
  }

  // ─── Navigation ───────────
  navPrev() {
    if (this.view() === 'month') {
      const m = new Date(this.currentMonth());
      m.setMonth(m.getMonth() - 1);
      this.currentMonth.set(m);
    } else {
      const d = new Date(this.currentWeekStart());
      d.setDate(d.getDate() - 7);
      this.currentWeekStart.set(d);
    }
  }

  navNext() {
    if (this.view() === 'month') {
      const m = new Date(this.currentMonth());
      m.setMonth(m.getMonth() + 1);
      this.currentMonth.set(m);
    } else {
      const d = new Date(this.currentWeekStart());
      d.setDate(d.getDate() + 7);
      this.currentWeekStart.set(d);
    }
  }

  goToday() {
    this.currentWeekStart.set(this.getMonday(new Date()));
    this.currentMonth.set(new Date());
  }

  onMonthDayClick(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    this.currentWeekStart.set(this.getMonday(d));
    this.view.set('day');
  }

  // ─── CRUD ─────────────────
  getAppointmentsForDay(dateStr: string): Appointment[] {
    return this.appointments().filter(a => a.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  openNewAppointment() {
    this.formData = this.freshForm();
    this.patientSearchQuery = '';
    this.showPatientDropdown = false;
    this.editingId.set(null);
    this.showModal.set(true);
  }

  editAppointment(appt: Appointment) {
    this.formData = { ...appt };
    this.patientSearchQuery = appt.clientName;
    this.showPatientDropdown = false;
    this.editingId.set(appt.id);
    this.showModal.set(true);
  }

  saveAppointment() {
    const all = [...this.appointments()];
    if (this.editingId()) {
      const idx = all.findIndex(a => a.id === this.editingId());
      if (idx >= 0) all[idx] = { ...this.formData } as Appointment;
    } else {
      all.push({ ...this.formData, id: crypto.randomUUID() } as Appointment);
    }
    this.appointments.set(all);
    this.persist();
    this.closeModal();
  }

  deleteAppointment(id: string) {
    if (confirm('¿Eliminar esta cita?')) {
      this.appointments.update(list => list.filter(a => a.id !== id));
      this.persist();
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.showPatientDropdown = false;
  }

  // ─── Helpers ──────────────
  getTypeColor(type: string): string {
    return APPOINTMENT_TYPES.find(t => t.id === type)?.color || '#084983';
  }

  getTypeLabel(type: string): string {
    return APPOINTMENT_TYPES.find(t => t.id === type)?.label || type;
  }

  formatStatus(s: string): string {
    const map: Record<string, string> = {
      programada: 'Programada', confirmada: 'Confirmada',
      completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No asistió'
    };
    return map[s] || s;
  }

  private freshForm(): any {
    const now = new Date();
    const duration = this.pz.preferences().defaultSessionMinutes;
    const startH = now.getHours();
    const endH = startH + Math.floor(duration / 60);
    const endM = duration % 60;
    return {
      id: '', patientId: '', clientName: '', date: now.toISOString().split('T')[0],
      startTime: `${String(startH).padStart(2, '0')}:00`,
      endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      type: 'individual', notes: '', status: 'programada',
    };
  }

  private getMonday(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  }

  private loadAppointments(): Appointment[] {
    return this.storage.get<Appointment[]>(this.KEY) || [];
  }

  private persist() {
    this.storage.set(this.KEY, this.appointments());
  }
}
