import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'um-mobile-install',
  standalone: true,
  template: `
    <div class="install-screen animate-fadeInUp">
      <div class="install-header">
        <div class="logo-orb">
          <img src="assets/images/brand/logo-color-vertical.png" alt="PsicoRuta" />
        </div>
        <h1>{{ installTitle }}</h1>
        <p>{{ installSubtitle }}</p>
      </div>

      <div class="install-steps">
        @if (isIos) {
          <div class="step">
            <span class="step-num">1</span>
            Toca el ícono de Compartir <span class="icon-inline">↑</span> abajo en el menú de Safari.
          </div>
          <div class="step">
            <span class="step-num">2</span>
            Busca y selecciona la opción <strong>"Agregar a inicio"</strong> (Add to Home Screen).
          </div>
          <div class="step">
            <span class="step-num">3</span>
            Confirma tocando <strong>"Agregar"</strong> arriba a la derecha.
          </div>
        } @else {
          <div class="step">
            <span class="step-num">1</span>
            Toca los tres puntos <span class="icon-inline">⋮</span> en el menú superior de Chrome.
          </div>
          <div class="step">
            <span class="step-num">2</span>
            Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a la pantalla principal".
          </div>
          <div class="step">
            <span class="step-num">3</span>
            Confirma la instalación de PsicoRuta.
          </div>
        }
      </div>

      <div class="install-footer">
        <p class="sub-text">Una vez instalado, ubica a PsicoRuta entre tus aplicaciones y úsala desde ahí.</p>
        <button class="fallback-btn" (click)="forceEnter()">O entrar temporalmente en el navegador</button>
      </div>
    </div>
  `,
  styles: [`
    .install-screen {
      min-height: 100vh;
      background: #f4f9f7;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px 24px;
      text-align: center;
      font-family: inherit;
    }
    .install-header { margin-bottom: 32px; }
    .logo-orb { width: 80px; height: 80px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; animation: bounce 3s infinite ease-in-out; }
    .logo-orb img { width: 44px; height: auto; }
    
    h1 { font-size: 1.95rem; font-weight: 800; color: #1a2e35; margin-bottom: 12px; letter-spacing: -0.02em; }
    p { font-size: 1.05rem; color: #5a7a84; line-height: 1.6; margin: 0; }
    
    .install-steps { text-align: left; background: white; padding: 24px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,40,30,0.06); margin-bottom: 40px; }
    
    .step { font-size: 1rem; color: #1a2e35; margin-bottom: 20px; font-weight: 500; display: flex; align-items: flex-start; gap: 12px; line-height: 1.5; }
    .step:last-child { margin-bottom: 0; }
    .step-num { flex-shrink: 0; width: 24px; height: 24px; background: rgba(8,73,131,0.1); color: #084983; font-weight: 800; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-top: 2px; }
    .icon-inline { background: #f4f9f7; color: #1a2e35; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 0.9rem; border: 1px solid rgba(0,0,0,0.05); }
    
    strong { color: #1a2e35; font-weight: 800; }
    
    .install-footer { margin-top: auto; padding-top: 20px; }
    .sub-text { font-size: 0.95rem; font-weight: 600; color: #1a2e35; margin-bottom: 24px; }
    .fallback-btn { background: transparent; border: none; color: #084983; font-weight: 700; text-decoration: underline; padding: 12px; cursor: pointer; font-size: 0.95rem; opacity: 0.8; }
    
    .animate-fadeInUp { animation: fadeInUp 600ms cubic-bezier(0.16, 1, 0.3, 1) both; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MobileInstallComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  
  isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  redirectTarget = 'today';
  
  get installTitle(): string {
    return this.redirectTarget === 'ot' ? 'Instala tu Monitoreo Operativo' : 'Instala tu Coach Móvil';
  }

  get installSubtitle(): string {
    return this.redirectTarget === 'ot' 
      ? 'Monitoreo Operativo es una Web App (PWA). Agrégala a tu pantalla de inicio para gestionar tus órdenes como una App nativa.' 
      : 'Tu Asistente Táctico es una Web App (PWA). Agrégalo a tu pantalla de inicio para usarlo como una App nativa de un solo toque y sin distracciones.';
  }
  
  ngOnInit() {
    this.redirectTarget = this.route.snapshot.queryParamMap.get('redirect') || 'today';
    
    // Detect PWA Status natively
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    // If the app is launched from Home Screen, skip installer and go to destination!
    // The auth guard will have already processed the ?auth= token from the bookmarked URL!
    if (isStandalone) {
      this.router.navigate(['/m', this.redirectTarget], { replaceUrl: true });
    }
  }

  forceEnter() {
    this.router.navigate(['/m', this.redirectTarget]);
  }
}
