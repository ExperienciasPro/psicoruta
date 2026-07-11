import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SyncService } from '../services/sync.service';

/**
 * Guard para rutas desktop (/d/...).
 * Permite el acceso desde cualquier dispositivo — el layout
 * responsivo se encarga de la experiencia.
 */
export const desktopOnlyGuard: CanActivateFn = () => true;

/**
 * Guard que bloquea rutas móviles en escritorio.
 * Redirige a la Consola de Mando (desktop/dashboard).
 */
export const mobileOnlyGuard: CanActivateFn = () => {
  const syncService = inject(SyncService);
  const router = inject(Router);

  if (syncService.isDesktop()) {
    router.navigate(['/d/dashboard']);
    return false;
  }
  return true;
};
