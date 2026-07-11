import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PersonalizationService,
  COLOR_PALETTES, ColorPalette,
  CLIENT_TERMINOLOGIES, ClientTerminology,
  SESSION_DURATIONS,
  CURRENCIES, CurrencyOption,
  AppPreferences
} from '../../../core/services/personalization.service';

@Component({
  selector: 'app-personalization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pz-page">

      <!-- Header -->
      <header class="pz-header">
        <div>
          <h1 class="pz-title">Personalización</h1>
          <p class="pz-subtitle">Configura la apariencia y terminología de tu espacio clínico</p>
        </div>
        <button class="pz-reset-btn" (click)="resetAll()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Restaurar valores
        </button>
      </header>

      <!-- ═══ SECCIÓN 1: Terminología del Cliente ═══ -->
      <section class="pz-section">
        <div class="pz-section-header">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <div>
            <h2 class="pz-section-title">Terminología Clínica</h2>
            <p class="pz-section-desc">¿Cómo llamas a las personas que atiendes?</p>
          </div>
        </div>
        <div class="pz-term-grid">
          @for (term of terminologies; track term.id) {
            <button
              class="pz-term-card"
              [class.selected]="prefs().clientTerminologyId === term.id"
              (click)="selectTerminology(term.id)"
            >
              <span class="pz-term-singular">{{ term.singular }}</span>
              <span class="pz-term-desc">{{ term.description }}</span>
              @if (prefs().clientTerminologyId === term.id) {
                <div class="pz-term-check">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              }
            </button>
          }
        </div>
        @if (savedBanner()) {
          <div class="pz-saved-banner">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>{{ savedBanner() }}</span>
          </div>
        }
      </section>

      <!-- ═══ SECCIÓN 2: Paleta de Color ═══ -->
      <section class="pz-section">
        <div class="pz-section-header">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="13.5" cy="6.5" r="2.5"></circle>
            <circle cx="17.5" cy="10.5" r="2.5"></circle>
            <circle cx="8.5" cy="7.5" r="2.5"></circle>
            <circle cx="6.5" cy="12.5" r="2.5"></circle>
            <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-1.7 5-4 5c-1.2 0-2.2-.5-3-1.3-.8-.8-2-1.3-3-1.3-2 0-3.5 1.6-3.5 3.5 0 1 .4 1.8 1 2.5"></path>
          </svg>
          <div>
            <h2 class="pz-section-title">Paleta de Color</h2>
            <p class="pz-section-desc">Define la identidad visual de tu espacio</p>
          </div>
        </div>
        <div class="pz-palette-grid">
          @for (palette of palettes; track palette.id) {
            <button
              class="pz-palette-card"
              [class.selected]="prefs().colorPaletteId === palette.id"
              (click)="selectPalette(palette.id)"
            >
              <div class="pz-palette-preview">
                @for (color of palette.preview; track color) {
                  <div class="pz-palette-swatch" [style.background]="color"></div>
                }
              </div>
              <div class="pz-palette-info">
                <span class="pz-palette-name">{{ palette.name }}</span>
                <span class="pz-palette-desc">{{ palette.description }}</span>
              </div>
              @if (prefs().colorPaletteId === palette.id) {
                <div class="pz-palette-check">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              }
            </button>
          }
        </div>
      </section>

      <!-- ═══ SECCIÓN 3: Práctica Profesional ═══ -->
      <section class="pz-section">
        <div class="pz-section-header">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <div>
            <h2 class="pz-section-title">Tu Práctica</h2>
            <p class="pz-section-desc">Información de tu consultorio o práctica profesional</p>
          </div>
        </div>
        <div class="pz-form-grid">
          <div class="pz-form-group">
            <label class="pz-label">Nombre de tu práctica</label>
            <input
              class="pz-input"
              type="text"
              placeholder="Ej: Centro de Bienestar Integral"
              [ngModel]="prefs().practiceName"
              (ngModelChange)="updatePref('practiceName', $event)"
            >
            <span class="pz-hint">Se mostrará en la interfaz y documentos generados</span>
          </div>
          <div class="pz-form-group">
            <label class="pz-label">Título profesional</label>
            <input
              class="pz-input"
              type="text"
              placeholder="Ej: Psicóloga Clínica"
              [ngModel]="prefs().professionalTitle"
              (ngModelChange)="updatePref('professionalTitle', $event)"
            >
          </div>
        </div>
      </section>

      <!-- ═══ SECCIÓN 4: Sesiones y Citas ═══ -->
      <section class="pz-section">
        <div class="pz-section-header">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <div>
            <h2 class="pz-section-title">Sesiones y Formato</h2>
            <p class="pz-section-desc">Duración por defecto y formato de visualización</p>
          </div>
        </div>
        <div class="pz-form-grid three-cols">
          <div class="pz-form-group">
            <label class="pz-label">Duración de sesión</label>
            <div class="pz-duration-options">
              @for (mins of durations; track mins) {
                <button
                  class="pz-duration-chip"
                  [class.selected]="prefs().defaultSessionMinutes === mins"
                  (click)="updatePref('defaultSessionMinutes', mins)"
                >
                  {{ mins }} min
                </button>
              }
            </div>
          </div>
          <div class="pz-form-group">
            <label class="pz-label">Moneda</label>
            <select
              class="pz-select"
              [ngModel]="prefs().currencyCode"
              (ngModelChange)="updatePref('currencyCode', $event)"
            >
              @for (cur of currencies; track cur.code) {
                <option [value]="cur.code">{{ cur.symbol }} {{ cur.name }}</option>
              }
            </select>
          </div>
          <div class="pz-form-group">
            <label class="pz-label">Formato de fecha</label>
            <select
              class="pz-select"
              [ngModel]="prefs().dateFormat"
              (ngModelChange)="updatePref('dateFormat', $event)"
            >
              <option value="dd/MM/yyyy">DD/MM/AAAA (31/12/2026)</option>
              <option value="MM/dd/yyyy">MM/DD/AAAA (12/31/2026)</option>
              <option value="yyyy-MM-dd">AAAA-MM-DD (2026-12-31)</option>
            </select>
          </div>
        </div>
      </section>

      <!-- ═══ SECCIÓN 5: Experiencia de Interfaz ═══ -->
      <section class="pz-section">
        <div class="pz-section-header">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <div>
            <h2 class="pz-section-title">Experiencia de Interfaz</h2>
            <p class="pz-section-desc">Ajusta el comportamiento visual de la aplicación</p>
          </div>
        </div>
        <div class="pz-toggles">
          <div class="pz-toggle-row">
            <div class="pz-toggle-info">
              <span class="pz-toggle-label">Sidebar compacto</span>
              <span class="pz-toggle-desc">Mantener la barra lateral contraída por defecto</span>
            </div>
            <label class="pz-switch">
              <input type="checkbox" [ngModel]="prefs().compactSidebar" (ngModelChange)="updatePref('compactSidebar', $event)">
              <span class="pz-slider"></span>
            </label>
          </div>
          <div class="pz-toggle-row">
            <div class="pz-toggle-info">
              <span class="pz-toggle-label">Acciones rápidas</span>
              <span class="pz-toggle-desc">Mostrar atajos de acción en el dashboard</span>
            </div>
            <label class="pz-switch">
              <input type="checkbox" [ngModel]="prefs().showQuickActions" (ngModelChange)="updatePref('showQuickActions', $event)">
              <span class="pz-slider"></span>
            </label>
          </div>
          <div class="pz-toggle-row">
            <div class="pz-toggle-info">
              <span class="pz-toggle-label">Mensaje de bienvenida</span>
              <span class="pz-toggle-desc">Mostrar un saludo personalizado al iniciar</span>
            </div>
            <label class="pz-switch">
              <input type="checkbox" [ngModel]="prefs().showWelcomeMessage" (ngModelChange)="updatePref('showWelcomeMessage', $event)">
              <span class="pz-slider"></span>
            </label>
          </div>
          @if (prefs().showWelcomeMessage) {
            <div class="pz-form-group pz-welcome-input">
              <input
                class="pz-input"
                type="text"
                placeholder="Escribe tu mensaje de bienvenida..."
                [ngModel]="prefs().welcomeMessage"
                (ngModelChange)="updatePref('welcomeMessage', $event)"
              >
            </div>
          }
          <div class="pz-toggle-row">
            <div class="pz-toggle-info">
              <span class="pz-toggle-label">Inicio de semana</span>
              <span class="pz-toggle-desc">Primer día de la semana en calendarios</span>
            </div>
            <div class="pz-day-toggle">
              <button
                class="pz-day-btn"
                [class.selected]="prefs().startOfWeek === 'monday'"
                (click)="updatePref('startOfWeek', 'monday')"
              >Lunes</button>
              <button
                class="pz-day-btn"
                [class.selected]="prefs().startOfWeek === 'sunday'"
                (click)="updatePref('startOfWeek', 'sunday')"
              >Domingo</button>
            </div>
          </div>
          <div class="pz-toggle-row">
            <div class="pz-toggle-info">
              <span class="pz-toggle-label">Auto-guardado</span>
              <span class="pz-toggle-desc">Intervalo de guardado automático en minutos</span>
            </div>
            <select class="pz-select pz-select-sm" [ngModel]="prefs().autoSaveInterval" (ngModelChange)="updatePref('autoSaveInterval', +$event)">
              <option [value]="1">1 min</option>
              <option [value]="3">3 min</option>
              <option [value]="5">5 min</option>
              <option [value]="10">10 min</option>
              <option [value]="15">15 min</option>
            </select>
          </div>
          <div class="pz-toggle-row">
            <div class="pz-toggle-info">
              <span class="pz-toggle-label">Tamaño de letra</span>
              <span class="pz-toggle-desc">Ajusta el tamaño de la tipografía en toda la aplicación</span>
            </div>
            <div class="pz-font-sizes">
              <button
                class="pz-font-btn"
                [class.selected]="prefs().fontSize === 'small'"
                (click)="updatePref('fontSize', 'small')"
              >
                <span class="pz-font-sample" style="font-size: 12px;">A</span>
                <span class="pz-font-label">Pequeña</span>
              </button>
              <button
                class="pz-font-btn"
                [class.selected]="prefs().fontSize === 'medium'"
                (click)="updatePref('fontSize', 'medium')"
              >
                <span class="pz-font-sample" style="font-size: 14px;">A</span>
                <span class="pz-font-label">Normal</span>
              </button>
              <button
                class="pz-font-btn"
                [class.selected]="prefs().fontSize === 'large'"
                (click)="updatePref('fontSize', 'large')"
              >
                <span class="pz-font-sample" style="font-size: 17px;">A</span>
                <span class="pz-font-label">Grande</span>
              </button>
              <button
                class="pz-font-btn"
                [class.selected]="prefs().fontSize === 'xlarge'"
                (click)="updatePref('fontSize', 'xlarge')"
              >
                <span class="pz-font-sample" style="font-size: 20px;">A</span>
                <span class="pz-font-label">Extra</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ PREVIEW LIVE ═══ -->
      <section class="pz-section pz-preview-section">
        <div class="pz-section-header">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <div>
            <h2 class="pz-section-title">Vista Previa</h2>
            <p class="pz-section-desc">Así se verá tu interfaz con la configuración actual</p>
          </div>
        </div>
        <div class="pz-preview-card">
          <div class="pz-preview-sidebar" [style.background]="activePalette().bgSecondary">
            <div class="pz-preview-logo" [style.color]="activePalette().textPrimary">
              {{ prefs().practiceName || 'PsicoRuta' }}
            </div>
            <div class="pz-preview-nav-item active" [style.color]="activePalette().accentPrimary" [style.background]="activePalette().accentPrimary + '15'">
              Dashboard
            </div>
            <div class="pz-preview-nav-item" [style.color]="activePalette().textSecondary">
              {{ activeTerminology().plural }}
            </div>
            <div class="pz-preview-nav-item" [style.color]="activePalette().textSecondary">
              Agenda
            </div>
          </div>
          <div class="pz-preview-main" [style.background]="activePalette().bgPrimary">
            <div class="pz-preview-topbar" [style.color]="activePalette().textPrimary">
              Mi Espacio Clínico
            </div>
            <div class="pz-preview-cards">
              <div class="pz-preview-mini-card" [style.background]="activePalette().accentPrimary + '18'" [style.border-left-color]="activePalette().accentPrimary">
                <span [style.color]="activePalette().textPrimary">3 {{ activeTerminology().plural }} hoy</span>
              </div>
              <div class="pz-preview-mini-card" [style.background]="activePalette().accentSecondary + '18'" [style.border-left-color]="activePalette().accentSecondary">
                <span [style.color]="activePalette().textPrimary">Sesión de {{ prefs().defaultSessionMinutes }} min</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styleUrl: './personalization.component.scss'
})
export class PersonalizationComponent {
  private pzService = inject(PersonalizationService);

  palettes = COLOR_PALETTES;
  terminologies = CLIENT_TERMINOLOGIES;
  durations = SESSION_DURATIONS;
  currencies = CURRENCIES;

  prefs = this.pzService.preferences;
  activePalette = this.pzService.activePalette;
  activeTerminology = this.pzService.activeTerminology;
  savedBanner = signal('');

  selectPalette(id: string) { this.pzService.update('colorPaletteId', id); }

  selectTerminology(id: string) {
    this.pzService.update('clientTerminologyId', id);
    const term = CLIENT_TERMINOLOGIES.find(t => t.id === id);
    if (term) {
      this.savedBanner.set(`¡Guardado! Ahora usarás "${term.singular}" / "${term.plural}" en toda la plataforma`);
      setTimeout(() => this.savedBanner.set(''), 4000);
    }
  }

  updatePref<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) {
    this.pzService.update(key, value);
  }
  resetAll() {
    if (confirm('¿Restaurar todas las preferencias a sus valores por defecto?')) {
      this.pzService.reset();
    }
  }
}
