import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataSyncService } from './core/services/data-sync.service';
import { StorageService } from './core/services/storage.service';
import { UserService } from './core/services/user.service';

@Component({
  selector: 'um-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private dataSync = inject(DataSyncService);
  private storage = inject(StorageService);
  private userService = inject(UserService);

  constructor() {
    // Reactively sync to server whenever storage changes (debounced)
    effect(() => {
      // Read the update token — this triggers the effect on every storage.set() call
      this.storage.updateToken();
      // Sync to server (debounced — won't fire on initial effect run due to internal skip logic)
      this.dataSync.saveToServerDebounced();
    });
  }

  async ngOnInit() {
    // Sync data from server on app startup
    const didRestore = await this.dataSync.syncFromServer();

    // If data was restored from the server (e.g. fresh browser / Safari),
    // re-run all migrations (superadmin, passwords, subscribers→users)
    // so that authentication works correctly on browsers where localStorage was empty.
    if (didRestore) {
      console.log('[App] Data restored from server — reinitializing UserService');
      this.userService.reinitialize();
    }
  }

  ngOnDestroy() {
    // Save before closing
    this.dataSync.saveToServer();
  }
}
