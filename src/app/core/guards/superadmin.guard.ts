import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user.service';

/**
 * Guard that restricts access to superadmin-only routes.
 * Redirects non-superadmin users to the dashboard.
 */
export const superadminGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (userService.isSuperAdmin()) {
    return true;
  }

  router.navigate(['/d/dashboard']);
  return false;
};
