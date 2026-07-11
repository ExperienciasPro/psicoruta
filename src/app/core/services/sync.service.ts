import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private platformId = inject(PLATFORM_ID);

  private isMobileSignal = signal(false);

  readonly isMobile = this.isMobileSignal.asReadonly();
  readonly isDesktop = computed(() => !this.isMobileSignal());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobile();
      window.addEventListener('resize', () => this.checkMobile());
    }
  }

  private checkMobile(): void {
    this.isMobileSignal.set(window.innerWidth < 768);
  }
}
