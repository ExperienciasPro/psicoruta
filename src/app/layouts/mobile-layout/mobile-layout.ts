import { Component, signal, OnInit, PLATFORM_ID, inject, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { UmIconComponent } from '../../shared/components/um-icon/um-icon';
import { ReminderService, RemoteReminder } from '../../core/services/reminder.service';

@Component({
  selector: 'um-mobile-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UmIconComponent],
  template: `
    <div class="mobile-shell">
      <!-- Mobile Header -->
      <header class="mobile-header">
        <img class="mobile-logo" src="assets/images/brand/logo-color-vertical.png" alt="PsicoRuta" />
        <h1 class="mobile-title">{{ isOtRoute() ? 'Monitoreo Operativo' : 'Coach Móvil' }}</h1>
        <div class="header-right">
          @if (reminderSvc.unreadCount() > 0) {
            <button class="notif-btn" (click)="toggleReminders()" title="Recordatorios">
              🔔
              <span class="notif-badge">{{ reminderSvc.unreadCount() }}</span>
            </button>
          }
          <button class="mobile-action-btn" title="Captura rápida" routerLink="/m/capture"><um-icon name="pencil" [size]="20"></um-icon></button>
        </div>
      </header>

      <!-- Reminder Dropdown -->
      @if (showReminders()) {
        <div class="reminder-dropdown animate-fadeInDown">
          <div class="reminder-header">
            <strong>🔔 Recordatorios</strong>
            <button class="dismiss-all" (click)="dismissAllReminders()">Marcar todo leído</button>
          </div>
          @for (r of reminderSvc.reminders(); track r.id) {
            @if (!r.read) {
              <div class="reminder-item" [class.high]="r.priority === 'high'" (click)="ackReminder(r.id)">
                <span class="reminder-icon">{{ r.icon }}</span>
                <div class="reminder-body">
                  <strong>{{ r.title }}</strong>
                  <p>{{ r.message }}</p>
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- Install Prompt (PWA) -->
      @if (showInstallPrompt()) {
        <div class="pwa-prompt animate-fadeInDown">
          <div class="pwa-text">
            <strong>📲 Instala tu {{ isOtRoute() ? 'Monitoreo Operativo' : 'Coach Móvil' }}</strong>
            <p>Añade a tu inicio desde las opciones de tu navegador.</p>
          </div>
          <button class="pwa-close" (click)="dismissInstall()" aria-label="Cerrar">✕</button>
        </div>
      }

      <!-- Page Content -->
      <main class="mobile-content">
        <router-outlet />
      </main>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        @for (tab of tabs; track tab.route) {
          <a
            class="bottom-nav-item"
            [routerLink]="tab.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: tab.exact }"
          >
            <um-icon class="tab-icon" [name]="tab.icon" [size]="26"></um-icon>
            <span class="tab-label">{{ tab.label }}</span>
          </a>
        }
      </nav>
    </div>
  `,
  styles: [`
    .header-right { display: flex; align-items: center; gap: 8px; }
    .notif-btn { position: relative; background: none; border: none; font-size: 1.3rem; cursor: pointer; padding: 4px; }
    .notif-badge { position: absolute; top: -4px; right: -6px; background: #e74c3c; color: #fff; font-size: 0.65rem; font-weight: 800; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

    .reminder-dropdown { position: absolute; top: 56px; left: 12px; right: 12px; background: #fff; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.15); z-index: 999; padding: 16px; max-height: 60vh; overflow-y: auto; }
    .reminder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.95rem; }
    .dismiss-all { background: none; border: none; color: #084983; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
    .reminder-item { display: flex; gap: 10px; padding: 10px; border-radius: 12px; background: #f8f9fa; margin-bottom: 8px; cursor: pointer; transition: background 0.2s; }
    .reminder-item:hover { background: #eef5f2; }
    .reminder-item.high { background: #fff5f5; border-left: 3px solid #e74c3c; }
    .reminder-icon { font-size: 1.4rem; flex-shrink: 0; }
    .reminder-body { flex: 1; }
    .reminder-body strong { font-size: 0.9rem; color: #1a2e35; display: block; margin-bottom: 2px; }
    .reminder-body p { font-size: 0.8rem; color: #5a7a84; margin: 0; line-height: 1.4; }

    .animate-fadeInDown { animation: fadeInDown 300ms ease-out both; }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
  `],
  styleUrl: 'mobile-layout.scss',
})
export class MobileLayoutComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  reminderSvc = inject(ReminderService);

  showInstallPrompt = signal(false);
  showReminders = signal(false);
  
  isOtRoute(): boolean {
    return this.router.url.includes('/m/ot');
  }

  tabs = [
    { label: 'Hoy', icon: 'sun', route: '/m/today', exact: true },
    { label: 'OT', icon: 'board', route: '/m/ot', exact: false },
    { label: 'Radar', icon: 'radar', route: '/m/radar', exact: true },
    { label: 'Captura', icon: 'capture', route: '/m/capture', exact: true },
    { label: 'Briefing', icon: 'briefing', route: '/m/briefing', exact: true },
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkInstallPrompt();
      // Auto-sync reminders from backend
      this.reminderSvc.sync();
    }
  }

  private checkInstallPrompt() {
    const nav = window.navigator as any;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone;
    const isDismissed = localStorage.getItem('um_pwa_dismissed') === '1';

    if (!isStandalone && !isDismissed) {
      this.showInstallPrompt.set(true);
    }
  }

  dismissInstall() {
    localStorage.setItem('um_pwa_dismissed', '1');
    this.showInstallPrompt.set(false);
  }

  toggleReminders() {
    this.showReminders.update(v => !v);
  }

  ackReminder(id: string) {
    this.reminderSvc.acknowledge(id);
  }

  async dismissAllReminders() {
    await this.reminderSvc.dismissAll();
    this.showReminders.set(false);
  }
}
