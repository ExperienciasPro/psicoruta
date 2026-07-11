import { Routes } from '@angular/router';
import { desktopOnlyGuard, mobileOnlyGuard } from './core/guards/device.guard';
import { authGuard } from './core/guards/auth.guard';
import { alreadyOnboardedGuard } from './core/guards/onboarding.guard';
import { superadminGuard } from './core/guards/superadmin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'welcome',
    canActivate: [alreadyOnboardedGuard],
    loadComponent: () =>
      import('./features/welcome/welcome').then((m) => m.WelcomeComponent),
  },
  {
    path: 'setup',
    loadComponent: () =>
      import('./features/module-picker/module-picker').then((m) => m.ModulePickerComponent),
  },
  {
    path: 'd',
    canActivate: [authGuard, desktopOnlyGuard],
    loadComponent: () =>
      import('./layouts/desktop-layout/desktop-layout').then((m) => m.DesktopLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/desktop/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'goals',
        loadComponent: () =>
          import('./features/desktop/goals/goals.component').then((m) => m.GoalsComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/desktop/projects/projects.component').then((m) => m.ProjectsComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/desktop/analytics/analytics.component').then((m) => m.AnalyticsComponent),
      },
      {
        path: 'admin/income',
        loadComponent: () =>
          import('./shared/components/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'coach',
        loadComponent: () =>
          import('./features/desktop/coach/coach').then((m) => m.CoachDesktopComponent),
      },
      {
        path: 'radar',
        loadComponent: () =>
          import('./features/desktop/radar/radar-inventory/radar-inventory').then((m) => m.RadarInventoryComponent),
      },
      {
        path: 'radar/board',
        loadComponent: () =>
          import('./features/desktop/radar/radar-board/radar-board').then((m) => m.RadarBoardComponent),
      },
      {
        path: 'cashflow',
        loadComponent: () =>
          import('./features/desktop/cashflow/cashflow').then((m) => m.CashflowComponent),
      },
      {
        path: 'admin-formularios',
        loadComponent: () =>
          import('./features/admin-formularios/admin-formularios.component').then((m) => m.AdminFormulariosComponent),
      },
      {
        path: 'tests',
        loadComponent: () =>
          import('./features/tests/tests.component').then((m) => m.TestsComponent),
      },
      {
        path: 'datos',
        loadComponent: () =>
          import('./features/admin-resultados/admin-resultados.component').then((m) => m.AdminResultadosComponent),
      },
      {
        path: 'resultados',
        loadComponent: () =>
          import('./features/admin-dashboards/admin-dashboards.component').then((m) => m.AdminDashboardsComponent),
      },
      {
        path: 'admin-entrenamientos',
        loadComponent: () =>
          import('./features/admin-entrenamientos/admin-entrenamientos.component').then((m) => m.AdminEntrenamientosComponent),
      },
      {
        path: 'clinica',
        loadComponent: () =>
          import('./features/desktop/clinica/clinica').then((m) => m.ClinicaComponent),
      },
      {
        path: 'clinica-analytics',
        loadComponent: () =>
          import('./features/desktop/clinica-analytics/clinica-analytics').then((m) => m.ClinicaAnalyticsComponent),
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./features/desktop/agenda/agenda.component').then((m) => m.AgendaComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/desktop/settings/settings').then((m) => m.SettingsComponent),
      },
      {
        path: 'simulador',
        loadComponent: () =>
          import('./features/desktop/decision-simulator/pages/simulador-page.component').then((m) => m.SimuladorPageComponent),
      },
      {
        path: 'personalizar',
        loadComponent: () =>
          import('./features/desktop/personalization/personalization.component').then((m) => m.PersonalizationComponent),
      },
      {
        path: 'suscriptores',
        canActivate: [superadminGuard],
        loadComponent: () =>
          import('./features/desktop/subscribers/subscribers.component').then((m) => m.SubscribersComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'm',
    canActivate: [authGuard, mobileOnlyGuard],
    loadComponent: () =>
      import('./layouts/mobile-layout/mobile-layout').then((m) => m.MobileLayoutComponent),
    children: [
      {
        path: 'today',
        loadComponent: () =>
          import('./features/mobile/today/today').then((m) => m.TodayComponent),
      },
      {
        path: 'focus',
        loadComponent: () =>
          import('./features/mobile/task-focus/task-focus').then((m) => m.TaskFocusComponent),
      },
      {
        path: 'capture',
        loadComponent: () =>
          import('./features/mobile/quick-capture/quick-capture').then((m) => m.QuickCaptureComponent),
      },
      {
        path: 'briefing',
        loadComponent: () =>
          import('./features/mobile/briefing/briefing').then((m) => m.BriefingComponent),
      },
      {
        path: 'celebration',
        loadComponent: () =>
          import('./features/mobile/weekly-celebration/weekly-celebration').then((m) => m.WeeklyCelebrationComponent),
      },
      {
        path: 'install',
        loadComponent: () =>
          import('./features/mobile/install/install').then((m) => m.MobileInstallComponent),
      },
      {
        path: 'radar',
        loadComponent: () =>
          import('./features/mobile/daily-radar/daily-radar').then((m) => m.DailyRadarComponent),
      },
      { path: 'coach', redirectTo: 'today', pathMatch: 'full' },
      { path: '', redirectTo: 'today', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
