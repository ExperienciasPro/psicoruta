import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService, AppTheme } from '../../../core/services/theme.service';
import { StorageService } from '../../../core/services/storage.service';
import { UserService, UserProfile } from '../../../core/services/user.service';
import { PersonalizationService } from '../../../core/services/personalization.service';

interface ModuleDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

interface CategoryDef {
  id: string;
  icon: string;
  title: string;
  modules: ModuleDef[];
}

@Component({
  selector: 'um-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header animate-fadeInUp">
        <h1>Mi Cuenta</h1>
        <p class="header-subtitle">Ajustes y preferencias de la aplicación.</p>
      </div>

      <div class="settings-grid">
        <!-- ═══ USER PROFILE ═══ -->
        <div class="settings-section animate-fadeInUp">
          <h2><span>👤</span> Información de Perfil</h2>
          <div class="profile-grid">
            <div class="input-group">
              <label>Nombre de Usuario</label>
              <input type="text" [(ngModel)]="profileData().name" placeholder="Tu nombre..." />
            </div>
            <div class="input-group">
              <label>Correo Electrónico</label>
              <input type="email" [(ngModel)]="profileData().email" placeholder="tu@correo.com" />
            </div>
            <button class="save-profile-btn" (click)="saveUserProfile()" [disabled]="!isProfileDirty()">
              Guardar Cambios
            </button>
          </div>
        </div>

        <!-- ═══ SECURITY ═══ -->
        <div class="settings-section animate-fadeInUp">
          <h2><span>🔒</span> Seguridad</h2>
          @if (!showPasswordForm()) {
            <button class="action-btn" (click)="showPasswordForm.set(true)">
              <span class="action-icon">🔑</span>
              <div class="action-info">
                <span class="action-title">Cambiar Contraseña</span>
                <span class="action-desc">Actualiza tu clave de acceso</span>
              </div>
            </button>
          } @else {
            <div class="password-form">
              <div class="input-group">
                <label>Nueva Contraseña</label>
                <input type="password" [(ngModel)]="newPassword" placeholder="Mínimo 6 caracteres" />
              </div>
              <div class="password-actions">
                <button class="save-profile-btn" (click)="updatePassword()" [disabled]="newPassword().length < 4">
                  Actualizar Clave
                </button>
                <button class="cancel-btn" (click)="showPasswordForm.set(false)">Cancelar</button>
              </div>
            </div>
          }
        </div>

        <!-- ═══ MODULE MANAGER ═══ -->
        <div class="settings-section full-width animate-fadeInUp stagger-1">
          <h2><span>🧩</span> Módulos Activos</h2>
          <p class="section-hint">
            Activa o desactiva módulos según las necesidades de tu negocio.
          </p>

          <div class="mod-manager">
            @for (cat of categories; track cat.id) {
              <div class="mod-category">
                <div class="mod-cat-header">
                  <span class="mod-cat-icon">{{ cat.icon }}</span>
                  <span class="mod-cat-title">{{ cat.title }}</span>
                  <button class="mod-cat-toggle" (click)="toggleCategory(cat)">
                    {{ isCategoryFull(cat) ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
                <div class="mod-list">
                  @for (m of cat.modules; track m.id) {
                    <button
                      class="mod-item"
                      [class.active]="isEnabled(m.id)"
                      (click)="toggleModule(m.id)">
                      <span class="mod-icon">{{ m.icon }}</span>
                      <div class="mod-info">
                        <span class="mod-name">{{ m.name }}</span>
                        <!-- <span class="mod-desc">{{ m.desc }}</span> -->
                      </div>
                      <div class="mod-switch" [class.on]="isEnabled(m.id)">
                        <div class="mod-switch-thumb"></div>
                      </div>
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <div class="mod-summary">
            <span class="mod-count">{{ enabledCount() }} módulos activos</span>
            <button class="mod-reset-btn" (click)="resetModules()">
              ↻ Reset
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div class="settings-section animate-fadeInUp stagger-2">
          <h2><span>🎨</span> Apariencia</h2>
          <div class="theme-options">
            @for (t of themes; track t.value) {
              <button class="theme-card" [class.active]="themeService.theme() === t.value" (click)="themeService.setTheme(t.value)">
                <span class="theme-emoji-lg">{{ t.icon }}</span>
                <span class="theme-name">{{ t.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Data Management -->
        <div class="settings-section animate-fadeInUp stagger-3">
          <h2><span>💾</span> Datos</h2>
          <div class="settings-actions">
            <button class="action-btn" (click)="exportData()">
              <span class="action-icon">📤</span>
              <div class="action-info">
                <span class="action-title">Exportar</span>
                <!-- <span class="action-desc">Descarga backup JSON</span> -->
              </div>
            </button>
            <label class="action-btn import-label">
              <span class="action-icon">📥</span>
              <div class="action-info">
                <span class="action-title">Importar</span>
                <!-- <span class="action-desc">Restaura desde JSON</span> -->
              </div>
              <input type="file" accept=".json" class="file-input" (change)="importData($event)" />
            </label>
            <button class="action-btn danger" (click)="clearData()">
              <span class="action-icon">🗑️</span>
              <div class="action-info">
                <span class="action-title">Borrar</span>
                <!-- <span class="action-desc">Eliminar todo</span> -->
              </div>
            </button>
          </div>
        </div>

        <!-- About -->
        <div class="settings-section full-width animate-fadeInUp stagger-4">
          <h2><span>ℹ️</span> Acerca de</h2>
          <div class="about-flex">
            <div class="about-card">
              <span class="about-logo-emoji">✨</span>
              <div class="about-info">
                <span class="about-name">PsicoRuta</span>
                <span class="about-version">v1.0.0</span>
                <span class="about-desc">Plataforma inteligente para profesionales de la salud mental.</span>
              </div>
            </div>
            <div class="about-stats-row">
              <span class="stat">Local Browser Storage • No Servers • 100% Private</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast -->
      @if (toast()) {
        <div class="toast animate-fadeInUp">{{ toast() }}</div>
      }
    </div>
  `,
  styleUrl: 'settings.scss',
})
export class SettingsComponent {
  themeService = inject(ThemeService);
  private storage = inject(StorageService);
  private userService = inject(UserService);
  private pz = inject(PersonalizationService);

  toast = signal('');

  // ─── Profile & Security ───────────────────
  profileData = signal<Partial<UserProfile>>({ ...(this.userService.profile() || {}) });
  showPasswordForm = signal(false);
  newPassword = signal('');

  isProfileDirty = computed(() => {
    const current = this.userService.profile() || { name: '', email: '' }; // Provide default structure
    const data = this.profileData();
    // Use optional chaining carefully since data is Partial<UserProfile>
    return data.name !== current.name || data.email !== current.email;
  });

  saveUserProfile(): void {
    this.userService.saveProfile(this.profileData());
    this.showToast('✅ Perfil actualizado correctamente');
  }

  updatePassword(): void {
    const user = this.userService.profile();
    if (user && this.newPassword()) {
      this.userService.updateUserPassword(user.id, this.newPassword());
      this.newPassword.set('');
      this.showPasswordForm.set(false);
      this.showToast('✅ Contraseña actualizada correctamente');
    }
  }

  // ─── Module Management ────────────────────
  private readonly MODULES_KEY = 'um_enabled_modules';

  /** All available modules by category */
  categories: CategoryDef[] = [
    {
      id: 'health', icon: '⚕️', title: 'Clínica & Consulta',
      modules: [
        { id: 'clinica', icon: '🏥', name: this.pz.clientPlural(), desc: `Gestión de ${this.pz.clientPlural().toLowerCase()} e historiales clínicos` },
        { id: 'agenda', icon: '📅', name: 'Agenda', desc: 'Calendario de citas, sesiones y recordatorios' },
        { id: 'clinica_analytics', icon: '📈', name: 'Analítica Clínica', desc: 'Cruza datos para insights terapéuticos' },
      ],
    },
    {
      id: 'strategy', icon: '🧠', title: 'Estrategia & Seguimiento',
      modules: [
        { id: 'goals', icon: '🎯', name: 'Banco de Tareas Terapéuticas', desc: 'Tareas clínicas reutilizables con instrucciones y pasos' },
        { id: 'projects', icon: '📋', name: 'Proyectos Clínicos', desc: 'Programas, talleres e investigaciones' },
        { id: 'analytics', icon: '📊', name: 'Analítica de Práctica', desc: 'KPIs consolidados de tu actividad' },
      ],
    },
    {
      id: 'evaluacion', icon: '📋', title: 'Evaluación & Diagnóstico',
      modules: [
        { id: 'tests', icon: '🧪', name: 'Tests & Evaluaciones', desc: 'Evaluaciones psicotécnicas y diagnósticas' },
        { id: 'formularios', icon: '📋', name: 'Formularios Custom', desc: 'Formularios dinámicos para encuestas y anamnesis' },
        { id: 'datos', icon: '🗄️', name: 'Base de Datos', desc: 'Repositorio centralizado de información capturada' },
        { id: 'resultados', icon: '📊', name: 'Análisis de Datos', desc: 'Cruza información para obtener insights profundos' },
        { id: 'simulador', icon: '🧠', name: 'Simulador de Decisiones', desc: 'Escenarios interactivos de árbol de decisión clínica' },
      ],
    },
    {
      id: 'tools', icon: '🛠️', title: 'Herramientas',
      modules: [
        { id: 'entrenamientos', icon: '🎓', name: 'Entrenamientos', desc: 'Planes de capacitación y seguimiento de progreso' },
        { id: 'coach', icon: '📱', name: 'Coach Móvil', desc: 'Prioridades del día en tu bolsillo' },
      ],
    },
  ];

  /** Current enabled modules (reactive) */
  enabledModules = signal<Set<string>>(this.loadEnabledModules());

  enabledCount = computed(() => this.enabledModules().size);

  isEnabled(id: string): boolean {
    return this.enabledModules().has(id);
  }

  toggleModule(id: string): void {
    const next = new Set(this.enabledModules());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.enabledModules.set(next);
    this.saveModules(next);

    if (next.has(id)) {
      // Module was just enabled — check dependencies
      const depMsg = this.getActivationMessage(id, next);
      this.showToast(depMsg || `✅ ${this.getModuleName(id)} activado`);
    } else {
      this.showToast(`❌ ${this.getModuleName(id)} desactivado`);
    }
  }

  isCategoryFull(cat: CategoryDef): boolean {
    return cat.modules.every(m => this.enabledModules().has(m.id));
  }

  toggleCategory(cat: CategoryDef): void {
    const next = new Set(this.enabledModules());
    const allOn = this.isCategoryFull(cat);
    cat.modules.forEach(m => {
      if (allOn) {
        next.delete(m.id);
      } else {
        next.add(m.id);
      }
    });
    this.enabledModules.set(next);
    this.saveModules(next);
    this.showToast(allOn ? `Categoría ${cat.title} desactivada` : `✅ Categoría ${cat.title} activada`);
  }

  resetModules(): void {
    if (confirm('¿Quieres volver a seleccionar tus módulos desde cero?')) {
      this.storage.remove(this.MODULES_KEY);
      window.location.href = '/setup';
    }
  }

  private loadEnabledModules(): Set<string> {
    const saved = this.storage.get<string[]>(this.MODULES_KEY);
    if (saved) return new Set(saved);
    // Default: all enabled
    return new Set(this.categories.flatMap(c => c.modules.map(m => m.id)));
  }

  private saveModules(set: Set<string>): void {
    this.storage.set(this.MODULES_KEY, Array.from(set));
  }

  private getModuleName(id: string): string {
    for (const cat of this.categories) {
      const mod = cat.modules.find(m => m.id === id);
      if (mod) return mod.name;
    }
    return id;
  }

  // ─── Module Dependencies ───────────────────
  /**
   * Map of moduleId → { requires: related modules, hint: visible text }
   * These are "soft" dependencies — recommendations, not hard blocks.
   */
  private readonly DEPENDENCIES: Record<string, { recommends: string[]; hint: string }> = {
    analytics: {
      recommends: ['goals', 'projects'],
      hint: 'Funciona mejor con Tareas y Proyectos activos.',
    },
    projects: {
      recommends: ['goals'],
      hint: 'Se potencia con Tareas y Objetivos para vincular asignaciones.',
    },
    clinica_analytics: {
      recommends: ['clinica', 'tests'],
      hint: 'Se integra con Clínica y Tests para análisis terapéutico.',
    },
    resultados: {
      recommends: ['formularios', 'tests'],
      hint: 'Funciona mejor con Formularios y Tests activos.',
    },
  };

  /** Returns a hint string if the module has dependencies that are not active */
  getDependencyHint(id: string): string | null {
    const dep = this.DEPENDENCIES[id];
    if (!dep) return null;
    const missing = dep.recommends.filter(r => !this.enabledModules().has(r));
    if (missing.length === 0) return null;
    return dep.hint;
  }

  /** Returns an activation message mentioning missing recommended modules */
  private getActivationMessage(id: string, enabled: Set<string>): string | null {
    const dep = this.DEPENDENCIES[id];
    if (!dep) return null;
    const missing = dep.recommends.filter(r => !enabled.has(r));
    if (missing.length === 0) return null;
    const names = missing.map(m => this.getModuleName(m)).join(', ');
    return `✅ ${this.getModuleName(id)} activado · 💡 Recomendado activar: ${names}`;
  }

  // ─── Theme ────────────────────────────────
  themes: { value: AppTheme; label: string; icon: string }[] = [
    { value: 'dark', label: 'Oscuro', icon: '🌙' },
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'auto', label: 'Auto', icon: '🌓' },
  ];

  // ─── Data Management ──────────────────────
  exportData(): void {
    const data: Record<string, unknown> = {};
    const keys = this.storage.getAllKeys('um_');
    for (const key of keys) {
      const raw = this.storage.getRaw(key);
      if (raw) {
        try { data[key] = JSON.parse(raw); }
        catch { data[key] = raw; }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `psicoruta-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('✅ Datos exportados');
  }

  importData(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        Object.entries(data).forEach(([key, value]) => {
          this.storage.set(key, value);
        });
        this.showToast('✅ Datos importados. Recarga la página.');
      } catch {
        this.showToast('❌ Error al importar');
      }
    };
    reader.readAsText(file);
  }

  clearData(): void {
    if (confirm('¿Estás seguro? Se eliminarán TODOS tus datos permanentemente.')) {
      this.storage.clear();
      this.showToast('🗑️ Datos eliminados. Recarga la página.');
    }
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
