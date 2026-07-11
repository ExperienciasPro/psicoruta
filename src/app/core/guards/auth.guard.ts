import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user.service';
import { StorageService } from '../services/storage.service';

/**
 * Auth guard — intercepta el Magic Link (auth=id) y redirige a /welcome si el usuario no se ha registrado.
 *
 * Handles the Chrome/new-browser scenario: when localStorage is empty but
 * data might exist on the server. Waits up to 3s for DataSyncService to
 * restore data before redirecting to login.
 */
export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const storage = inject(StorageService);

  // 1. Interceptar el "Magic Link" de Códigos QR o enlaces
  const urlTree = router.parseUrl(state.url);
  const magicToken = urlTree.queryParams['auth'];

  if (magicToken) {
    const user = userService.getUserById(magicToken);
    if (user) {
      userService.saveProfile(user); // Auto-login
    }
    
    if (!state.url.includes('/install')) {
      delete urlTree.queryParams['auth'];
      return router.navigateByUrl(urlTree, { replaceUrl: true });
    }
  }

  // 2. If already onboarded, allow access immediately
  if (userService.isOnboarded()) {
    return true;
  }

  // 3. Chrome/new-browser fix: if localStorage has no user data,
  //    it may be because DataSyncService hasn't finished restoring yet.
  //    Wait briefly for the async restore to complete.
  const hasLocalUsers = storage.has('um_users') || storage.has('um_user_profile');
  if (!hasLocalUsers) {
    // Wait up to 3 seconds for sync to populate localStorage
    const restored = await waitForProfileRestore(userService, 3000);
    if (restored) {
      return true;
    }
  }

  // If not registered or login failed, redirect to login
  router.navigate(['/login']);
  return false;
};

/**
 * Polls the UserService profile signal until onboarded or timeout.
 * This handles the window where DataSyncService is fetching from the server.
 */
function waitForProfileRestore(userService: UserService, timeoutMs: number): Promise<boolean> {
  return new Promise(resolve => {
    const interval = 200;
    let elapsed = 0;

    const check = () => {
      // Re-read from storage and re-run migrations in case DataSyncService
      // just wrote restored data (subscriber→user migration, superadmin, etc.)
      userService.reloadProfile();

      if (userService.isOnboarded()) {
        resolve(true);
        return;
      }

      elapsed += interval;
      if (elapsed >= timeoutMs) {
        resolve(false);
        return;
      }

      setTimeout(check, interval);
    };

    // First check after a short delay to let the sync start
    setTimeout(check, interval);
  });
}

