import { Component, ElementRef, AfterViewInit, inject } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { PersonalizationService } from '../../../core/services/personalization.service';

@Component({
  selector: 'um-coach-desktop',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container animate-fadeInUp">
      <div class="page-header">
        <div class="header-icon">📱</div>
        <div>
          <h1>Coach Móvil</h1>
          <p class="subtitle">Tus {{ pz.clientPlural().toLowerCase() }} acceden a sus entrenamientos asignados desde su celular.</p>
        </div>
      </div>

      <div class="hero-layout">
        <!-- Left: Feature Card -->
        <div class="coach-card">
          <div class="coach-badge">🏋️ APP DE ENTRENAMIENTOS</div>
          <h3>Ejercicios terapéuticos en su bolsillo</h3>

          <div class="coach-benefits">
            <div class="benefit-item">
              <span class="b-icon">📋</span>
              <div>
                <strong>Entrenamientos asignados</strong>
                <p>Cada {{ pz.clientSingular().toLowerCase() }} recibe los ejercicios y micro-acciones que tú diseñas, directamente en su celular.</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="b-icon">🎯</span>
              <div>
                <strong>Sprints semanales guiados</strong>
                <p>Contenido de inspiración, micro-acciones prácticas y check-ins de reflexión, todo en una secuencia clara de 3 días.</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="b-icon">📊</span>
              <div>
                <strong>Registro de progreso</strong>
                <p>El {{ pz.clientSingular().toLowerCase() }} marca sus avances y registra su estado emocional. Tú lo ves en tiempo real desde Entrenamientos.</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="b-icon">🔔</span>
              <div>
                <strong>Recordatorios automáticos</strong>
                <p>Notificaciones que mantienen la adherencia al plan sin que tengas que enviar mensajes manualmente.</p>
              </div>
            </div>
          </div>

          <div class="coach-actions-panel">
            <div class="action-qr-box">
              <canvas #qrCanvas class="qr-canvas"></canvas>
              <div class="qr-text">👆 <strong>ESCANEA AQUÍ</strong><br/>El {{ pz.clientSingular().toLowerCase() }} escanea<br/>con su cámara</div>
            </div>
            <div class="action-separator">
              <span>ó</span>
            </div>
            <div class="action-btn-box">
              <button class="coach-btn whatsapp" (click)="sendWhatsApp()">
                💬 Enviar link al {{ pz.clientSingular().toLowerCase() }}
              </button>
              <p class="action-hint">Se abre WhatsApp con el enlace listo para enviar</p>
            </div>
          </div>
        </div>

        <!-- Right: Phone Mockup (patient view) -->
        <div class="mockup-container">
          <div class="css-phone">
            <div class="screen-mask">
              <div class="mock-screen">
                <!-- Status bar -->
                <div class="mock-status">
                  <span>9:41</span>
                  <div class="mock-status-icons">
                    <span>📶</span><span>🔋</span>
                  </div>
                </div>
                <!-- App header -->
                <div class="mock-header">
                  <span class="mock-logo">🧠</span>
                  <span class="mock-app-name">Mi Entrenamiento</span>
                </div>
                <!-- Greeting -->
                <div class="mock-greeting">
                  <span class="mock-wave">👋</span>
                  <div>
                    <div class="mock-greet-text">Hola, María</div>
                    <div class="mock-greet-date">Semana 3 de tu plan</div>
                  </div>
                </div>
                <!-- Sprint progress -->
                <div class="mock-sprint-card">
                  <div class="mock-sprint-label">SPRINT ACTIVO</div>
                  <div class="mock-sprint-title">Tolerancia a la Frustración</div>
                  <div class="mock-sprint-progress">
                    <div class="mock-progress-bar">
                      <div class="mock-progress-fill" style="width: 66%"></div>
                    </div>
                    <span class="mock-progress-text">2 de 3 días</span>
                  </div>
                </div>
                <!-- Days checklist -->
                <div class="mock-days">
                  <div class="mock-day done">
                    <span class="mock-day-check">✓</span>
                    <div>
                      <div class="mock-day-name">Día 1 · Inspiración</div>
                      <div class="mock-day-desc">Video: "Respirar antes de reaccionar"</div>
                    </div>
                  </div>
                  <div class="mock-day done">
                    <span class="mock-day-check">✓</span>
                    <div>
                      <div class="mock-day-name">Día 3 · Micro-acción</div>
                      <div class="mock-day-desc">Contar hasta 5 antes de responder</div>
                    </div>
                  </div>
                  <div class="mock-day pending">
                    <span class="mock-day-check pending-check">3</span>
                    <div>
                      <div class="mock-day-name">Día 5 · Check-in</div>
                      <div class="mock-day-desc">¿Cómo te fue esta semana?</div>
                    </div>
                  </div>
                </div>
                <!-- Emotional register -->
                <div class="mock-emo">
                  <div class="mock-emo-label">¿CÓMO TE SIENTES HOY?</div>
                  <div class="mock-emo-faces">
                    <span>😔</span><span>😐</span><span class="selected">🙂</span><span>😊</span><span>🤩</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- How it works -->
      <div class="how-it-works">
        <h3 class="section-title">¿Cómo funciona?</h3>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-num">1</div>
            <h4>Crea el entrenamiento</h4>
            <p>Desde el módulo <strong>Entrenamientos</strong>, diseña el plan con los sprints y ejercicios que necesita tu {{ pz.clientSingular().toLowerCase() }}.</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-card">
            <div class="step-num">2</div>
            <h4>Envía el enlace</h4>
            <p>Comparte el acceso vía QR o WhatsApp. El {{ pz.clientSingular().toLowerCase() }} abre la app desde su navegador móvil.</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-card">
            <div class="step-num">3</div>
            <h4>Monitorea el progreso</h4>
            <p>Revisa en tiempo real qué ejercicios completó, su registro emocional y sus victorias desde tu panel.</p>
          </div>
        </div>
      </div>

      <!-- Features grid -->
      <div class="features-grid">
        <div class="feature-card">
          <div class="fc-icon">🌟</div>
          <h4>Día 1: Inspiración</h4>
          <p>Artículos, videos o audios motivacionales que preparan al {{ pz.clientSingular().toLowerCase() }} para la práctica.</p>
        </div>
        <div class="feature-card">
          <div class="fc-icon">✅</div>
          <h4>Día 3: Micro-acción</h4>
          <p>Un ejercicio pequeño y concreto para aplicar en situaciones reales de la vida diaria.</p>
        </div>
        <div class="feature-card">
          <div class="fc-icon">💬</div>
          <h4>Día 5: Check-in</h4>
          <p>Reflexión guiada para evaluar cómo le fue y registrar aprendizajes de la semana.</p>
        </div>
        <div class="feature-card">
          <div class="fc-icon">🌡️</div>
          <h4>Termómetro emocional</h4>
          <p>Registro diario del estado emocional que se refleja en gráficas dentro de tu panel de Entrenamientos.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-container {
      padding: 40px 48px; max-width: 1300px; margin: 0 auto;
    }

    .page-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 36px;

      .header-icon {
        width: 48px; height: 48px; border-radius: 14px;
        background: var(--accent-primary, #084983);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; opacity: 0.9;
      }
      h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 28px; font-weight: 800;
        color: var(--text-primary, #2c3e2e); margin: 0 0 2px;
      }
      .subtitle {
        color: var(--text-secondary, #6b7b6e); font-size: 14px; margin: 0;
      }
    }

    .hero-layout {
      display: flex; align-items: stretch; gap: 40px; margin-bottom: 48px;
      @media (max-width: 1000px) { flex-direction: column; }
    }

    .coach-card {
      flex: 1; background: var(--bg-secondary, #F2EFE9);
      border-radius: 20px; padding: 40px;
    }

    .coach-badge {
      display: inline-block; padding: 5px 14px;
      background: var(--accent-primary, #084983); color: white;
      border-radius: 20px; font-size: 11px; font-weight: 800;
      letter-spacing: 0.05em; margin-bottom: 16px;
    }

    h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 24px; font-weight: 800;
      color: var(--text-primary, #2c3e2e);
      margin: 0 0 28px; letter-spacing: -0.02em;
    }

    .coach-benefits { display: flex; flex-direction: column; gap: 20px; margin-bottom: 32px; }

    .benefit-item {
      display: flex; gap: 14px; align-items: flex-start;
      strong { display: block; font-size: 14px; color: var(--text-primary, #2c3e2e); margin-bottom: 4px; font-weight: 700; }
      p { font-size: 13px; color: var(--text-secondary, #6b7b6e); line-height: 1.5; margin: 0; }
      .b-icon { font-size: 20px; line-height: 1; margin-top: 2px; flex-shrink: 0; width: 26px; text-align: center; }
    }

    .coach-actions-panel {
      display: flex; align-items: center; gap: 20px;
      background: var(--bg-primary, white);
      padding: 20px; border-radius: 16px; flex-wrap: wrap;
    }

    .action-qr-box {
      display: flex; align-items: center; gap: 14px;
      .qr-canvas { width: 90px; height: 90px; display: block; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
      .qr-text { font-size: 12px; color: var(--text-secondary, #6b7b6e); line-height: 1.5;
        strong { color: var(--text-primary, #2c3e2e); font-weight: 800; font-size: 13px; }
      }
    }

    .action-separator { font-size: 13px; font-weight: 600; color: var(--text-muted, #9BA8AA); padding: 0 4px; }

    .action-hint { font-size: 11px; color: var(--text-muted, #9BA8AA); margin: 6px 0 0; }

    .coach-btn {
      padding: 14px 22px; border-radius: 14px;
      font-weight: 700; font-size: 14px; cursor: pointer;
      transition: all 200ms; border: none; font-family: inherit;
      display: flex; align-items: center; gap: 8px;

      &.whatsapp {
        background: #25D366; color: white;
        box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);
        &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37, 211, 102, 0.35); }
      }
    }

    /* ─── Phone Mockup ─── */
    .mockup-container {
      width: 280px; flex-shrink: 0;
      display: flex; justify-content: center; align-items: center;
      @media (max-width: 1000px) { width: 100%; }
    }

    .css-phone {
      width: 270px; height: 580px;
      background: #1a1a1e; border-radius: 40px; padding: 10px;
      box-shadow: 0 30px 60px rgba(0,40,30,0.15), inset 0 0 0 2px #333;
      position: relative;

      &::before {
        content: ''; position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
        width: 100px; height: 22px;
        background: #1a1a1e; border-radius: 0 0 14px 14px; z-index: 10;
      }
    }

    .screen-mask {
      width: 100%; height: 100%;
      background: #FAFAF7; border-radius: 32px; overflow: hidden;
    }

    .mock-screen {
      height: 100%; padding: 0; display: flex; flex-direction: column;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    .mock-status {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 20px 4px; font-size: 11px; font-weight: 700; color: #333;
      .mock-status-icons { display: flex; gap: 4px; font-size: 10px; }
    }

    .mock-header {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 20px 10px; border-bottom: 1px solid rgba(0,0,0,0.04);
      .mock-logo { font-size: 18px; }
      .mock-app-name { font-size: 14px; font-weight: 800; color: #2c3e2e; letter-spacing: -0.02em; }
    }

    .mock-greeting {
      display: flex; align-items: center; gap: 10px; padding: 12px 20px 6px;
      .mock-wave { font-size: 20px; }
      .mock-greet-text { font-size: 15px; font-weight: 800; color: #2c3e2e; }
      .mock-greet-date { font-size: 9px; color: #8a9a8c; margin-top: 1px; font-weight: 600; }
    }

    .mock-sprint-card {
      margin: 8px 18px; background: linear-gradient(135deg, #084983, #009fe3);
      border-radius: 14px; padding: 14px 16px; color: white;
      .mock-sprint-label { font-size: 8px; font-weight: 800; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 4px; }
      .mock-sprint-title { font-size: 13px; font-weight: 800; margin-bottom: 10px; }
      .mock-sprint-progress { display: flex; align-items: center; gap: 10px; }
      .mock-progress-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.3); border-radius: 4px; overflow: hidden; }
      .mock-progress-fill { height: 100%; background: white; border-radius: 4px; }
      .mock-progress-text { font-size: 9px; font-weight: 700; opacity: 0.9; white-space: nowrap; }
    }

    .mock-days { padding: 8px 18px; display: flex; flex-direction: column; gap: 6px; }
    .mock-day {
      display: flex; align-items: center; gap: 10px;
      background: white; border-radius: 10px; padding: 8px 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      .mock-day-check {
        width: 22px; height: 22px; border-radius: 50%;
        background: #084983; color: white;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; font-weight: 800; flex-shrink: 0;
        &.pending-check { background: #E0D8CC; color: #8a9a8c; }
      }
      .mock-day-name { font-size: 10px; font-weight: 700; color: #2c3e2e; }
      .mock-day-desc { font-size: 8px; color: #8a9a8c; }
      &.pending { opacity: 0.7; }
    }

    .mock-emo {
      margin: auto 18px 14px; background: #F2EFE9; border-radius: 12px; padding: 10px;
      text-align: center;
      .mock-emo-label { font-size: 7px; font-weight: 800; color: #8a9a8c; letter-spacing: 0.08em; margin-bottom: 6px; }
      .mock-emo-faces { display: flex; justify-content: center; gap: 10px; font-size: 20px;
        span { cursor: pointer; opacity: 0.4; transition: all 0.2s; &.selected { opacity: 1; transform: scale(1.2); } }
      }
    }

    /* ─── How it Works ─── */
    .how-it-works { margin-bottom: 40px; }

    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 20px; font-weight: 800;
      color: var(--text-primary, #2c3e2e);
      margin: 0 0 20px;
    }

    .steps-grid {
      display: flex; align-items: stretch; gap: 0;
      @media (max-width: 800px) { flex-direction: column; gap: 16px; }
    }

    .step-card {
      flex: 1; background: var(--bg-secondary, #F2EFE9);
      border-radius: 16px; padding: 24px;
      .step-num {
        width: 32px; height: 32px; border-radius: 50%;
        background: var(--accent-primary, #084983); color: white;
        font-weight: 800; font-size: 14px;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 12px;
      }
      h4 {
        font-family: 'Outfit', sans-serif;
        font-size: 15px; font-weight: 700;
        color: var(--text-primary, #2c3e2e); margin: 0 0 8px;
      }
      p { font-size: 12px; color: var(--text-secondary, #6b7b6e); line-height: 1.5; margin: 0;
        strong { color: var(--text-primary, #2c3e2e); }
      }
    }

    .step-arrow {
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; color: var(--text-muted, #9BA8AA);
      padding: 0 8px; font-weight: 300;
      @media (max-width: 800px) { display: none; }
    }

    /* ─── Features Grid ─── */
    .features-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
      @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
      @media (max-width: 500px) { grid-template-columns: 1fr; }
    }

    .feature-card {
      background: var(--bg-secondary, #F2EFE9);
      border-radius: 16px; padding: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }

      .fc-icon { font-size: 28px; margin-bottom: 12px; }
      h4 {
        font-family: 'Outfit', sans-serif;
        font-size: 15px; font-weight: 700;
        color: var(--text-primary, #2c3e2e); margin: 0 0 8px;
      }
      p { font-size: 12px; color: var(--text-secondary, #6b7b6e); line-height: 1.5; margin: 0; }
    }

    .animate-fadeInUp { animation: fadeInUp 500ms cubic-bezier(0.16, 1, 0.3, 1) both; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CoachDesktopComponent implements AfterViewInit {
  private el = inject(ElementRef);
  private userService = inject(UserService);
  pz = inject(PersonalizationService);

  get mobileUrl(): string {
    const userId = this.userService.profile()?.id;
    return `https://psicoruta.pro/m/install?auth=${userId || ''}`;
  }

  ngAfterViewInit(): void {
    this.generateQR();
  }

  private async generateQR(): Promise<void> {
    const canvas = this.el.nativeElement.querySelector('.qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    try {
      const qrModule = await import('qrcode');
      const QRCode = qrModule.default || qrModule;
      await QRCode.toCanvas(canvas, this.mobileUrl, {
        width: 160, margin: 2,
        color: { dark: '#2c3e2e', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
    } catch (e) {
      console.error('QR_ERROR', e);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 160; canvas.height = 160;
        ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 0, 160, 160);
        ctx.fillStyle = '#2c3e2e'; ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QR disponible', 80, 75);
        ctx.fillText('en producción', 80, 92);
      }
    }
  }

  sendWhatsApp(): void {
    const term = this.pz.clientSingular().toLowerCase();
    const text = encodeURIComponent(
      `📱 ¡Hola! Aquí está tu acceso al Coach Móvil de PsicoRuta:\n${this.mobileUrl}\n\nAbre el enlace desde tu celular para acceder a tus entrenamientos y ejercicios asignados. 🏋️‍♀️`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }
}
