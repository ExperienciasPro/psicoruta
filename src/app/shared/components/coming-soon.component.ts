import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cs-page">
      <div class="cs-card">
        <div class="cs-icon">🚧</div>
        <h2 class="cs-title">{{ title }}</h2>
        <p class="cs-desc">Este módulo está en desarrollo. Pronto estará disponible.</p>
        <a class="cs-btn" routerLink="/d/dashboard">Volver al Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .cs-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      padding: 40px;
    }
    .cs-card {
      text-align: center;
      max-width: 400px;
      padding: 48px 40px;
      background: var(--bg-secondary, #F2EFE9);
      border-radius: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.04);
    }
    .cs-icon { font-size: 48px; margin-bottom: 16px; }
    .cs-title {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary, #084983);
      margin: 0 0 8px;
    }
    .cs-desc {
      font-size: 14px;
      color: var(--text-secondary, #3A6A8E);
      margin: 0 0 24px;
      line-height: 1.5;
    }
    .cs-btn {
      display: inline-block;
      padding: 10px 24px;
      background: var(--accent-primary, #084983);
      color: white;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s;
    }
    .cs-btn:hover { box-shadow: 0 4px 16px rgba(8,73,131,0.3); }
  `]
})
export class ComingSoonComponent {
  @Input() title = 'Próximamente';
}
