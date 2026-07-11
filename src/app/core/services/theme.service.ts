import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type AppTheme = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'um_theme';
  private themeSignal = signal<AppTheme>('auto');

  readonly theme = this.themeSignal.asReadonly();

  constructor(private storage: StorageService) {
    const saved = this.storage.get<AppTheme>(this.STORAGE_KEY);
    if (saved) {
      this.themeSignal.set(saved);
    }
    this.applyTheme();
  }

  setTheme(theme: AppTheme): void {
    this.themeSignal.set(theme);
    this.storage.set(this.STORAGE_KEY, theme);
    this.applyTheme();
  }

  toggle(): void {
    const current = this.themeSignal();
    const next: AppTheme = current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
    this.setTheme(next);
  }

  private applyTheme(): void {
    const theme = this.themeSignal();
    const root = document.documentElement;

    root.classList.remove('theme-light', 'theme-dark');

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      root.classList.add(`theme-${theme}`);
    }
  }
}
