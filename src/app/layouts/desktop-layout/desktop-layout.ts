import { Component, inject, signal, computed, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { GoalService } from '../../core/services/goal.service';
import { TaskService } from '../../core/services/task.service';
import { SalesService } from '../../core/services/sales.service';
import { UserService } from '../../core/services/user.service';
import { StorageService } from '../../core/services/storage.service';
import { SyncService } from '../../core/services/sync.service';
import { PersonalizationService } from '../../core/services/personalization.service';
import { PdIconComponent } from '../../shared/components/pd-icon.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  moduleId?: string;
}

@Component({
  selector: 'um-desktop-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, PdIconComponent],
  template: `
    <div class="desktop-shell" [class.sidebar-collapsed]="collapsed()" [class.sidebar-compact]="!isExpanded()" [class.is-mobile]="isMobile()">

      <!-- ═══ MOBILE HEADER ═══ (only visible on mobile) -->
      <header class="mobile-topbar">
        <button class="mob-menu-btn" (click)="toggleMobileDrawer()" aria-label="Menú">☰</button>
        <h2 class="mob-title">{{ pageTitle() }}</h2>
        <div class="mob-actions">
          <button class="mob-btn" (click)="toggleSearch()" title="Buscar">🔍</button>
          <button class="mob-btn" (click)="themeService.toggle()" title="Tema">{{ themeEmoji() }}</button>
        </div>
      </header>

      <!-- ═══ SIDEBAR OVERLAY BACKDROP ═══ (mobile) -->
      @if (mobileDrawerOpen()) {
        <div class="drawer-backdrop" (click)="toggleMobileDrawer()"></div>
      }

      <!-- ═══ SIDEBAR ═══ -->
      <aside class="sidebar" [class.drawer-open]="mobileDrawerOpen()" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
        <div class="sidebar-header">
          <div class="logo-area">
            @if (isExpanded() || isMobile()) {
              <img src="assets/images/brand/logo-color-horizontal.png" alt="PsicoRuta" class="sidebar-logo-full" />
            } @else {
              <img src="assets/images/brand/logo-color-vertical.png" alt="PR" class="sidebar-logo-icon" />
            }
          </div>
          @if (!isMobile()) {
            <button class="collapse-btn" (click)="toggleSidebar()" [attr.aria-label]="collapsed() ? 'Expandir sidebar' : 'Colapsar sidebar'">
              <span class="collapse-icon" [class.rotated]="collapsed()">‹</span>
            </button>
          } @else {
            <button class="collapse-btn" (click)="toggleMobileDrawer()" aria-label="Cerrar menú">✕</button>
          }
        </div>

        <nav class="sidebar-nav">
          @for (item of navItems(); track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
              [attr.title]="!isExpanded() && !isMobile() ? item.label : null"
              (click)="onNavClick()"
            >
              <pd-icon class="nav-icon" [name]="item.icon" [size]="18"></pd-icon>
              @if (isExpanded() || isMobile()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          }


        </nav>

        <div class="sidebar-footer">
          <!-- Mobile-only: link to Coach Móvil -->
          @if (isMobile()) {
            <a class="nav-item coach-link" routerLink="/m/today" (click)="onNavClick()">
              <span class="nav-icon">📱</span>
              <span class="nav-label">Coach Móvil</span>
            </a>
          }
          <a class="user-pill" routerLink="/d/settings" routerLinkActive="active" (click)="onNavClick()">
            <span class="user-avatar">👤</span>
            @if (isExpanded() || isMobile()) {
              <span class="user-name">Mi Cuenta</span>
            }
          </a>
          <button class="logout-btn" (click)="logout()" title="Cerrar Sesión">
            <pd-icon name="log-out" [size]="16"></pd-icon>
            @if (isExpanded() || isMobile()) {
              <span class="logout-label">Cerrar Sesión</span>
            }
          </button>
        </div>
      </aside>

      <!-- ═══ MAIN CONTENT AREA ═══ -->
      <div class="main-area">
        <!-- Desktop Topbar (hidden on mobile) -->
        <header class="topbar">
          <div class="topbar-left">
            @if (collapsed()) {
              <button class="topbar-btn expand-btn" title="Abrir menú" (click)="toggleSidebar()">
                <span>☰</span>
              </button>
            }
            <h2 class="page-title">Consola de Mando</h2>
          </div>
          <div class="topbar-right">
            <button class="topbar-btn" title="Buscar" (click)="toggleSearch()"><span>🔍</span></button>
            <button class="topbar-btn" title="Notificaciones" (click)="toggleNotifications()">
              <span>🔔</span>
              @if (unreadNotifications() > 0) {
                <span class="notification-dot"></span>
              }
            </button>
            <button class="topbar-btn theme-toggle" title="Cambiar tema" (click)="themeService.toggle()">
              <span>{{ themeEmoji() }}</span>
            </button>
          </div>
        </header>

        <!-- Search Panel -->
        @if (searchOpen()) {
          <div class="search-panel animate-fadeInUp">
            <div class="search-bar">
              <span class="search-icon">🔍</span>
              <input
                class="search-input"
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Buscar metas, tareas, deals..."
                autofocus
                (keyup.escape)="toggleSearch()"
              />
              <button class="search-close" (click)="toggleSearch()">✕</button>
            </div>
            @if (searchResults().length) {
              <div class="search-results">
                @for (r of searchResults(); track r.id) {
                  <a class="search-result-item" [routerLink]="r.route" (click)="toggleSearch()">
                    <span class="sr-icon">{{ r.icon }}</span>
                    <div class="sr-info">
                      <span class="sr-title">{{ r.title }}</span>
                      <span class="sr-type">{{ r.type }}</span>
                    </div>
                  </a>
                }
              </div>
            } @else if (searchQuery().trim().length > 1) {
              <div class="search-empty">Sin resultados para "{{ searchQuery() }}"</div>
            }
          </div>
        }

        <!-- Notifications Panel -->
        @if (notificationsOpen()) {
          <div class="notifications-panel animate-fadeInUp">
            <div class="notif-header">
              <h3>Notificaciones</h3>
              <button class="notif-close" (click)="toggleNotifications()">✕</button>
            </div>
            @if (notifications().length) {
              @for (n of notifications(); track n.id) {
                <div class="notif-item" [class.unread]="!n.read">
                  <span class="notif-icon">{{ n.icon }}</span>
                  <div class="notif-content">
                    <span class="notif-message">{{ n.message }}</span>
                    <span class="notif-time">{{ n.time }}</span>
                  </div>
                </div>
              }
            } @else {
              <div class="notif-empty">Sin notificaciones 🎉</div>
            }
          </div>
        }

        <!-- Page Content -->
        <main class="content-area">
          <router-outlet />
        </main>
      </div>

      <!-- ═══ MOBILE BOTTOM NAV ═══ (quick access on mobile) -->
      @if (isMobile()) {
        <nav class="mob-bottom-nav">
          <a class="mob-nav-item" routerLink="/d/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="mob-nav-icon">🏠</span>
            <span class="mob-nav-label">Inicio</span>
          </a>
          @for (q of quickNavItems(); track q.route) {
            <a class="mob-nav-item" [routerLink]="q.route" routerLinkActive="active">
              <span class="mob-nav-icon">{{ q.icon }}</span>
              <span class="mob-nav-label">{{ q.label }}</span>
            </a>
          }
          <button class="mob-nav-item" (click)="toggleMobileDrawer()">
            <span class="mob-nav-icon">≡</span>
            <span class="mob-nav-label">Más</span>
          </button>
        </nav>
      }
    </div>
  `,
  styleUrl: 'desktop-layout.scss',
})
export class DesktopLayoutComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private syncService = inject(SyncService);
  private router = inject(Router);
  themeService = inject(ThemeService);
  private goalService = inject(GoalService);
  private taskService = inject(TaskService);
  private salesService = inject(SalesService);
  private pz = inject(PersonalizationService);

  collapsed = signal(true);
  isHovered = signal(false);
  searchOpen = signal(false);
  notificationsOpen = signal(false);
  searchQuery = signal('');
  mobileDrawerOpen = signal(false);

  isMobile = computed(() => this.syncService.isMobile());
  isExpanded = computed(() => !this.collapsed() || this.isHovered());

  /** Dynamic page title based on current route */
  pageTitle = computed(() => {
    const url = this.router.url;
    const match = this.navItems().find((i: NavItem) => url.startsWith(i.route));
    return match ? match.label : 'Consola de Mando';
  });

  /** Top 3 most useful modules for the mobile bottom bar */
  quickNavItems = computed(() => {
    return this.navItems().filter((i: NavItem) => i.route !== '/d/dashboard').slice(0, 3);
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // On mobile, start with sidebar collapsed
      if (this.syncService.isMobile()) {
        this.collapsed.set(true);
      }
    }
  }

  onMouseEnter() {
    if (this.collapsed() && !this.isMobile()) {
      this.isHovered.set(true);
    }
  }

  onMouseLeave() {
    if (this.collapsed() && !this.isMobile()) {
      this.isHovered.set(false);
    }
  }

  themeEmoji = computed(() => {
    const t = this.themeService.theme();
    return t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '🌓';
  });

  toggleMobileDrawer(): void {
    this.mobileDrawerOpen.update(v => !v);
  }

  onNavClick(): void {
    // Close drawer on mobile after navigation
    if (this.isMobile()) {
      this.mobileDrawerOpen.set(false);
    }
  }

  searchResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (q.length < 2) return [];
    const results: { id: string; title: string; type: string; icon: string; route: string }[] = [];

    this.goalService.goals().forEach(g => {
      if (g.title.toLowerCase().includes(q)) {
        results.push({ id: g.id, title: g.title, type: 'Meta', icon: '🎯', route: `/d/goals/${g.id}` });
      }
    });

    this.taskService.tasks().forEach(t => {
      if (t.title.toLowerCase().includes(q)) {
        results.push({ id: t.id, title: t.title, type: 'Tarea', icon: '✅', route: `/d/goals` });
      }
    });

    this.salesService.deals().forEach(d => {
      if (d.contactName.toLowerCase().includes(q)) {
        results.push({ id: d.id, title: d.contactName, type: 'Deal', icon: '🤝', route: `/d/sales/deals` });
      }
    });

    this.salesService.funnels().forEach(f => {
      if (f.name.toLowerCase().includes(q)) {
        results.push({ id: f.id, title: f.name, type: 'Embudo', icon: '🌪️', route: `/d/sales/funnel/${f.id}` });
      }
    });

    return results.slice(0, 8);
  });

  notifications = computed(() => {
    const notifs: { id: string; icon: string; message: string; time: string; read: boolean }[] = [];

    const pendingTasks = this.taskService.pendingTasks();
    if (pendingTasks.length > 3) {
      notifs.push({ id: 'tasks', icon: '📋', message: `Tienes ${pendingTasks.length} tareas pendientes`, time: 'Ahora', read: false });
    }

    const stalledGoals = this.goalService.goals().filter(g => g.status === 'in_progress' && g.progress === 0);
    if (stalledGoals.length) {
      notifs.push({ id: 'goals', icon: '⚠️', message: `${stalledGoals.length} meta(s) sin progreso`, time: 'Hoy', read: false });
    }

    const openDeals = this.salesService.openDeals();
    if (openDeals.length > 0) {
      notifs.push({ id: 'deals', icon: '🤝', message: `${openDeals.length} deal(s) abiertos`, time: 'Hoy', read: true });
    }

    const completedGoals = this.goalService.goals().filter(g => g.status === 'completed');
    if (completedGoals.length) {
      notifs.push({ id: 'completed', icon: '🎉', message: `¡${completedGoals.length} meta(s) completada(s)!`, time: 'Reciente', read: true });
    }

    return notifs;
  });

  unreadNotifications = computed(() => this.notifications().filter(n => !n.read).length);

  private userService = inject(UserService);
  private storage = inject(StorageService);
  isSuperAdmin = computed(() => this.userService.isSuperAdmin());

  /** All known module IDs from the sidebar */
  private readonly ALL_MODULE_IDS = new Set([
    'clinica', 'agenda', 'goals', 'projects', 'analytics',
    'clinica_analytics', 'tests', 'formularios', 'datos',
    'resultados', 'entrenamientos', 'simulador', 'coach',
  ]);

  private enabledModules = computed(() => {
    this.storage.updateToken();
    const saved = this.storage.get<string[]>('um_enabled_modules');
    if (!saved) return null; // No config yet → show all

    // Include saved modules + any new modules that didn't exist
    // when the user originally set up (forward-compatible)
    const savedSet = new Set(saved);
    this.ALL_MODULE_IDS.forEach(id => {
      if (!savedSet.has(id)) {
        // Check if this module was available at setup time
        // by seeing if it was explicitly excluded (not just missing)
        // For simplicity, add new modules by default
        savedSet.add(id);
      }
    });
    return savedSet;
  });

  private isModuleActive(moduleId: string | undefined): boolean {
    if (!moduleId) return true;
    const enabled = this.enabledModules();
    return enabled ? enabled.has(moduleId) : true;
  }

  private readonly NAV_ORDER: Record<string, number> = {
    '/d/dashboard': 0,
    '/d/clinica': 1,
    '/d/agenda': 2,
    '/d/goals': 3,
    '/d/admin-entrenamientos': 4,
    '/d/projects': 5,
    '/d/analytics': 6,
    '/d/clinica-analytics': 7,
    '/d/tests': 8,
    '/d/admin-formularios': 9,
    '/d/datos': 10,
    '/d/resultados': 11,
    '/d/simulador': 12,
    '/d/coach': 13,
    '/d/personalizar': 99,
    '/d/suscriptores': 98,
  };

  navItems = computed(() => {
    const allItems: NavItem[] = [
      { label: 'Dashboard', icon: 'home', route: '/d/dashboard' },
      { label: this.pz.clientPlural(), icon: 'stethoscope', route: '/d/clinica', moduleId: 'clinica' },
      { label: 'Agenda', icon: 'calendar', route: '/d/agenda', moduleId: 'agenda' },
      { label: 'Banco de Tareas Terapéuticas', icon: 'target', route: '/d/goals', moduleId: 'goals' },
      { label: 'Entrenamientos', icon: 'graduation', route: '/d/admin-entrenamientos', moduleId: 'entrenamientos' },
      { label: 'Proyectos', icon: 'layout', route: '/d/projects', moduleId: 'projects' },
      { label: 'Analítica', icon: 'bar-chart', route: '/d/analytics', moduleId: 'analytics' },
      { label: 'Analítica Clínica', icon: 'trending-up', route: '/d/clinica-analytics', moduleId: 'clinica_analytics' },
      { label: 'Tests', icon: 'flask', route: '/d/tests', moduleId: 'tests' },
      { label: 'Formularios', icon: 'clipboard', route: '/d/admin-formularios', moduleId: 'formularios' },
      { label: 'Base de Datos', icon: 'database', route: '/d/datos', moduleId: 'datos' },
      { label: 'Análisis', icon: 'pie-chart', route: '/d/resultados', moduleId: 'resultados' },
      { label: 'Simulador', icon: 'brain', route: '/d/simulador', moduleId: 'simulador' },
      { label: 'Coach Móvil', icon: 'smartphone', route: '/d/coach', moduleId: 'coach' },
      { label: 'Personalizar', icon: 'settings', route: '/d/personalizar' },
    ];

    // Add superadmin-only items
    if (this.isSuperAdmin()) {
      allItems.push({
        label: 'Suscriptores', icon: 'diamond', route: '/d/suscriptores',
      });
    }

    return allItems
      .filter(item => this.isModuleActive(item.moduleId))
      .sort((a, b) => (this.NAV_ORDER[a.route] ?? 50) - (this.NAV_ORDER[b.route] ?? 50));
  });



  toggleSidebar(): void {
    this.collapsed.update((v) => !v);
    this.isHovered.set(false);
  }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
    if (!this.searchOpen()) this.searchQuery.set('');
    this.notificationsOpen.set(false);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update(v => !v);
    this.searchOpen.set(false);
  }

  /** Logout: clear active profile and navigate to login */
  logout(): void {
    if (this.isMobile()) {
      this.mobileDrawerOpen.set(false);
    }
    this.userService.clearProfile();
    this.router.navigate(['/login']);
  }
}
