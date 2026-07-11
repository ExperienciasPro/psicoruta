import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RadarService } from '../../../../core/services/radar.service';
import { SalesService } from '../../../../core/services/sales.service';
import { RadarContact, RelationshipTag, RELATIONSHIP_LABELS, RELATIONSHIP_ICONS } from '../../../../core/models/radar-contact.model';

@Component({
  selector: 'um-radar-inventory',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="radar-inventory">
      <!-- Header -->
      <div class="page-header animate-fadeInUp">
        <div class="header-left">
          <h1>📡 El Radar</h1>
          <p class="subtitle">Inventario de contactos · Pre-Pipeline CRM</p>
        </div>
        <div class="header-actions">
          <a class="btn-kanban" routerLink="/d/radar/board">📋 Ver Kanban</a>
          <button class="btn-add-bulk" (click)="showBulkAdd.set(!showBulkAdd())">
            {{ showBulkAdd() ? '✕ Cerrar' : '+ Agregar masivo' }}
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar animate-fadeInUp stagger-1">
        <div class="stat-chip">
          <span class="stat-dot radar-dot"></span>
          <span>{{ radarCount() }} en radar</span>
        </div>
        <div class="stat-chip">
          <span class="stat-dot contacted-dot"></span>
          <span>{{ contactedCount() }} contactados</span>
        </div>
        <div class="stat-chip">
          <span class="stat-dot snoozed-dot"></span>
          <span>{{ snoozedCount() }} en espera</span>
        </div>
        <div class="stat-chip">
          <span class="stat-dot promoted-dot"></span>
          <span>{{ promotedCount() }} promovidos</span>
        </div>
        <div class="stat-chip total">
          📊 {{ totalCount() }} total
        </div>
      </div>

      <!-- Bulk Add Panel -->
      @if (showBulkAdd()) {
        <div class="bulk-panel animate-fadeInUp">
          <h3>Agregar Contactos Rápido</h3>
          <p class="bulk-hint">Agrega uno a la vez con el formulario o pega varios contactos.</p>
          <div class="quick-add-form">
            <input class="qi" type="text" [(ngModel)]="newName" placeholder="Nombre *" />
            <input class="qi" type="tel" [(ngModel)]="newPhone" placeholder="Teléfono *" />
            <input class="qi" type="email" [(ngModel)]="newEmail" placeholder="Email (opcional)" />
            <input class="qi" type="text" [(ngModel)]="newCompany" placeholder="Empresa (opcional)" />
            <select class="qi" [(ngModel)]="newTag">
              @for (tag of tagOptions; track tag.value) {
                <option [value]="tag.value">{{ tag.icon }} {{ tag.label }}</option>
              }
            </select>
            <button class="btn-quick-add" [disabled]="!newName().trim() || !newPhone().trim()" (click)="addSingle()">
              + Agregar
            </button>
          </div>
        </div>
      }

      <!-- Filter Bar -->
      <div class="filter-bar animate-fadeInUp stagger-2">
        <input
          class="search-filter"
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="🔍 Buscar por nombre, teléfono o empresa..."
        />
        <select class="tag-filter" [(ngModel)]="filterTag">
          <option value="">Todos los tags</option>
          @for (tag of tagOptions; track tag.value) {
            <option [value]="tag.value">{{ tag.icon }} {{ tag.label }}</option>
          }
        </select>
        <select class="status-filter" [(ngModel)]="filterStatus">
          <option value="">Todos los estados</option>
          <option value="radar">📡 En el Radar</option>
          <option value="contacted">📨 Contactados</option>
          <option value="snoozed">⏸ En Espera</option>
          <option value="promoted">🚀 Promovidos</option>
        </select>
      </div>

      <!-- Data Grid -->
      <div class="data-grid animate-fadeInUp stagger-3">
        <div class="grid-header">
          <span class="gh col-name">Nombre</span>
          <span class="gh col-phone">Teléfono</span>
          <span class="gh col-company">Empresa</span>
          <span class="gh col-tag">Tag</span>
          <span class="gh col-status">Estado</span>
          <span class="gh col-actions">Acciones</span>
        </div>

        @if (filteredContacts().length) {
          @for (contact of filteredContacts(); track contact.id) {
            <div class="grid-row" [class]="contact.status">
              <span class="gc col-name">
                <span class="contact-avatar" [class]="contact.status">{{ contact.name.charAt(0).toUpperCase() }}</span>
                {{ contact.name }}
              </span>
              <span class="gc col-phone">{{ contact.phone }}</span>
              <span class="gc col-company">{{ contact.company || '—' }}</span>
              <span class="gc col-tag">
                <span class="tag-badge" [attr.data-tag]="contact.relationshipTag">
                  {{ getTagIcon(contact.relationshipTag) }} {{ getTagLabel(contact.relationshipTag) }}
                </span>
              </span>
              <span class="gc col-status">
                <span class="status-badge" [class]="contact.status">{{ getStatusLabel(contact.status) }}</span>
              </span>
              <span class="gc col-actions">
                @if (contact.status === 'radar') {
                  <button class="action-mini contact-action" title="Marcar contactado" (click)="markContacted(contact.id)">📨</button>
                  <button class="action-mini snooze-action" title="Posponer" (click)="snooze(contact.id)">⏸</button>
                }
                @if (contact.status === 'contacted') {
                  <button class="action-mini promote-action" title="Promover a Deal" (click)="openPromote(contact)">🚀</button>
                  <button class="action-mini snooze-action" title="Posponer" (click)="snooze(contact.id)">⏸</button>
                }
                @if (contact.status === 'snoozed') {
                  <button class="action-mini" title="Volver al Radar" (click)="moveBack(contact.id)">↩️</button>
                }
                <button class="action-mini delete-action" title="Eliminar" (click)="deleteContact(contact.id)">🗑</button>
              </span>
            </div>
          }
        } @else {
          <div class="grid-empty">
            <span class="empty-icon">📡</span>
            <h3>Sin contactos{{ searchTerm().trim() ? ' que coincidan' : '' }}</h3>
            <p>{{ searchTerm().trim() ? 'Prueba con otros filtros.' : 'Agrega contactos para empezar a construir tu radar.' }}</p>
          </div>
        }
      </div>

      <!-- Promote Modal -->
      @if (promoteContact()) {
        <div class="modal-backdrop" (click)="closePromote()">
          <div class="promote-modal animate-fadeInUp" (click)="$event.stopPropagation()">
            <h3>🚀 Promover a Deal</h3>
            <p class="promote-name">{{ promoteContact()!.name }}</p>

            <label class="modal-label">Embudo de ventas</label>
            <select class="qi" [(ngModel)]="promoteFunnelId">
              @for (f of funnels(); track f.id) {
                <option [value]="f.id">{{ f.name }}</option>
              }
            </select>

            @if (selectedFunnelStages().length) {
              <label class="modal-label">Etapa inicial</label>
              <select class="qi" [(ngModel)]="promoteStageId">
                @for (s of selectedFunnelStages(); track s.id) {
                  <option [value]="s.id">{{ s.name }}</option>
                }
              </select>
            }

            <label class="modal-label">Valor estimado (MXN)</label>
            <input class="qi" type="number" [(ngModel)]="promoteValue" placeholder="0" />

            <div class="modal-actions">
              <button class="btn-cancel" (click)="closePromote()">Cancelar</button>
              <button class="btn-promote" [disabled]="!promoteFunnelId() || !promoteStageId()" (click)="confirmPromote()">
                🚀 Crear Deal
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: 'radar-inventory.scss',
})
export class RadarInventoryComponent {
  private radarService = inject(RadarService);
  private salesService = inject(SalesService);

  showBulkAdd = signal(false);
  searchTerm = signal('');
  filterTag = signal('');
  filterStatus = signal('');

  // Quick add form
  newName = signal('');
  newPhone = signal('');
  newEmail = signal('');
  newCompany = signal('');
  newTag = signal<RelationshipTag>('acquaintance');

  // Promote modal
  promoteContact = signal<RadarContact | null>(null);
  promoteFunnelId = signal('');
  promoteStageId = signal('');
  promoteValue = signal(0);

  funnels = this.salesService.funnels;

  selectedFunnelStages = computed(() => {
    const fid = this.promoteFunnelId();
    if (!fid) return [];
    const funnel = this.salesService.getFunnelById(fid);
    return funnel?.stages || [];
  });

  tagOptions = [
    { value: 'family' as RelationshipTag, label: 'Familia', icon: '👨‍👩‍👧' },
    { value: 'university' as RelationshipTag, label: 'Universidad', icon: '🎓' },
    { value: 'former_colleague' as RelationshipTag, label: 'Ex Colega', icon: '💼' },
    { value: 'acquaintance' as RelationshipTag, label: 'Conocido', icon: '🤝' },
    { value: 'client' as RelationshipTag, label: 'Cliente', icon: '👔' },
    { value: 'referral' as RelationshipTag, label: 'Referido', icon: '🔗' },
    { value: 'event' as RelationshipTag, label: 'Evento', icon: '🎪' },
    { value: 'other' as RelationshipTag, label: 'Otro', icon: '📌' },
  ];

  // Stats
  radarCount = computed(() => this.radarService.radarContacts().length);
  contactedCount = computed(() => this.radarService.contactedContacts().length);
  snoozedCount = computed(() => this.radarService.snoozedContacts().length);
  promotedCount = computed(() => this.radarService.promotedContacts().length);
  totalCount = computed(() => this.radarService.contacts().length);

  filteredContacts = computed(() => {
    let contacts = this.radarService.contacts();
    const search = this.searchTerm().trim().toLowerCase();
    const tag = this.filterTag();
    const status = this.filterStatus();

    if (search) {
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(search) ||
        (c.company?.toLowerCase().includes(search))
      );
    }
    if (tag) contacts = contacts.filter(c => c.relationshipTag === tag);
    if (status) contacts = contacts.filter(c => c.status === status);

    return contacts;
  });

  getTagLabel(tag: RelationshipTag): string { return RELATIONSHIP_LABELS[tag]; }
  getTagIcon(tag: RelationshipTag): string { return RELATIONSHIP_ICONS[tag]; }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { radar: 'En el Radar', contacted: 'Contactado', snoozed: 'En Espera', promoted: 'Promovido' };
    return labels[status] || status;
  }

  addSingle(): void {
    if (!this.newName().trim() || !this.newPhone().trim()) return;
    this.radarService.addContact({
      name: this.newName().trim(),
      phone: this.newPhone().trim(),
      email: this.newEmail().trim() || undefined,
      company: this.newCompany().trim() || undefined,
      relationshipTag: this.newTag(),
      status: 'radar',
      hasTappedContactButton: false,
    });
    this.newName.set('');
    this.newPhone.set('');
    this.newEmail.set('');
    this.newCompany.set('');
    this.newTag.set('acquaintance');
  }

  markContacted(id: string): void { this.radarService.markContacted(id); }
  snooze(id: string): void { this.radarService.snooze(id, 1); }
  moveBack(id: string): void { this.radarService.moveBackToRadar(id); }
  deleteContact(id: string): void { this.radarService.deleteContact(id); }

  openPromote(contact: RadarContact): void {
    this.promoteContact.set(contact);
    const f = this.funnels();
    if (f.length) {
      this.promoteFunnelId.set(f[0].id);
      this.promoteStageId.set(f[0].stages[0]?.id || '');
    }
  }

  closePromote(): void { this.promoteContact.set(null); }

  confirmPromote(): void {
    const c = this.promoteContact();
    if (!c) return;
    this.radarService.promoteToDeal(c.id, this.promoteFunnelId(), this.promoteStageId(), this.promoteValue());
    this.closePromote();
  }
}
