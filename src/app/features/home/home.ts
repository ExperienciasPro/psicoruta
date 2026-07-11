import { Component, signal, AfterViewInit, OnDestroy, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'um-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="landing">
      <!-- ══════════════════════════════════════ -->
      <!-- NAV BAR -->
      <!-- ══════════════════════════════════════ -->
      <nav class="nav" [class.scrolled]="scrolled()">
        <div class="nav-inner">
          <a class="nav-logo" routerLink="/">
            <img src="assets/images/brand/logo-color-horizontal.png" alt="PsicoRuta" class="nav-brand-logo" />
          </a>
          <div class="nav-links">
            <a href="#diferencia">Nuestra Diferencia</a>
            <a href="#valor">Valor Clínico</a>
            <a href="#gestion">Gestión</a>
            <a href="#comparativa">Comparativa</a>
          </div>
          <div class="nav-actions">
            <a class="btn-nav-login" routerLink="/login">Iniciar sesión</a>
            <a class="btn-nav-cta" routerLink="/welcome">Prueba Gratuita</a>
          </div>
          <button class="nav-mobile-toggle" (click)="mobileMenu.set(!mobileMenu())">
            <span [class.open]="mobileMenu()"></span>
          </button>
        </div>
        <!-- Mobile menu -->
        <div class="nav-mobile" *ngIf="mobileMenu()">
          <a href="#diferencia" (click)="mobileMenu.set(false)">Nuestra Diferencia</a>
          <a href="#valor" (click)="mobileMenu.set(false)">Valor Clínico</a>
          <a href="#gestion" (click)="mobileMenu.set(false)">Gestión</a>
          <a href="#comparativa" (click)="mobileMenu.set(false)">Comparativa</a>
          <div class="nav-mobile-ctas">
            <a class="btn-nav-login" routerLink="/login" (click)="mobileMenu.set(false)">Iniciar sesión</a>
            <a class="btn-nav-cta" routerLink="/welcome" (click)="mobileMenu.set(false)">Prueba Gratuita</a>
          </div>
        </div>
      </nav>

      <!-- ══════════════════════════════════════ -->
      <!-- 1. HERO — El gancho principal -->
      <!-- ══════════════════════════════════════ -->
      <section class="hero">
        <div class="hero-bg-image"></div>
        <div class="hero-inner">
          <div class="hero-content reveal-left">
            <div class="hero-badge-row">
              <span class="hero-badge">🩺 Diseñada por psicólogos clínicos</span>
            </div>
            <h1>
              <span class="hero-line-1">La evolución de tu</span>
              <span class="hero-line-2 gradient-text">consulta clínica.</span>
            </h1>
            <p class="hero-sub">
              Una solución integral que combina la gestión administrativa con herramientas
              clínicas avanzadas para potenciar los resultados de tus pacientes.
            </p>
            <div class="hero-ctas">
              <a class="btn-primary-lg" routerLink="/welcome">
                Comienza tu prueba gratuita
                <span class="btn-arrow">→</span>
              </a>
              <a class="btn-outline-lg" href="#diferencia">
                Descubre más
                <span class="btn-icon">↓</span>
              </a>
            </div>

            <div class="hero-trust">
              <div class="trust-metric">
                <span class="metric-number counter" data-target="23">23</span>
                <span class="metric-label">Módulos clínicos</span>
              </div>
              <div class="trust-divider"></div>
              <div class="trust-metric">
                <span class="metric-number">100%</span>
                <span class="metric-label">Web, sin instalar</span>
              </div>
              <div class="trust-divider"></div>
              <div class="trust-metric">
                <span class="metric-number">24/7</span>
                <span class="metric-label">Acceso seguro</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════ -->
      <!-- 2. NUESTRA DIFERENCIA: EL ADN CLÍNICO -->
      <!-- ══════════════════════════════════════ -->
      <section class="dna-section" id="diferencia">
        <div class="section-inner">
          <div class="dna-grid">
            <div class="dna-text reveal">
              <span class="section-tag">Nuestro ADN Clínico</span>
              <h2>Creado por quienes están en el <span class="text-accent">consultorio</span>, no solo en la oficina.</h2>
              <p>
                A diferencia de los softwares genéricos, PsicoRuta nace de la práctica clínica real.
                Conocemos los desafíos de la atención y la importancia del rigor científico.
                Por eso, no solo organizamos tu agenda; <strong>potenciamos tu capacidad diagnóstica y terapéutica.</strong>
              </p>
              <a class="btn-primary-md" routerLink="/welcome">
                Explorar la plataforma
                <span class="btn-arrow">→</span>
              </a>
            </div>
            <div class="dna-visual reveal-right delay-2">
              <div class="dna-card-stack">

                <div class="dna-feature-card card-1">
                  <div class="dfc-icon"><img src="assets/images/home/icon_tests.png" alt="Tests" class="img-fluid anim-float-fast"></div>
                  <div class="dfc-body">
                    <strong>Tests integrados</strong>
                    <span>No transcribes, no calculas. Resultados automáticos al instante.</span>
                  </div>
                </div>
                <div class="dna-feature-card card-2">
                  <div class="dfc-icon"><img src="assets/images/home/icon_analytics.png" alt="Analytics" class="img-fluid anim-float-fast" style="animation-delay: -1s;"></div>
                  <div class="dfc-body">
                    <strong>Análisis de patrones</strong>
                    <span>Identifica tendencias en tu base de pacientes con gráficas automáticas.</span>
                  </div>
                </div>
                <div class="dna-feature-card card-3">
                  <div class="dfc-icon"><img src="assets/images/home/icon_app.png" alt="App" class="img-fluid anim-float-fast" style="animation-delay: -2s;"></div>
                  <div class="dfc-body">
                    <strong>App del paciente</strong>
                    <span>Entrenamientos terapéuticos y monitoreo entre sesiones.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      <!-- ══════════════════════════════════════ -->
      <!-- 3. VALOR DIFERENCIAL -->
      <!-- ══════════════════════════════════════ -->
      <section class="value-section" id="valor">
        <div class="section-inner">
          <div class="section-header reveal">
            <span class="section-tag">Más allá de lo administrativo</span>
            <h2>Herramientas que <span class="gradient-text">transforman</span> tu práctica.</h2>
          </div>

          <!-- Two column value blocks -->
          <div class="value-columns">
            <!-- Column 1: Eficacia Clínica -->
            <div class="value-block reveal delay-1">
              <div class="vb-header">
                <div class="vb-icon-box sage"><img src="assets/images/home/icon_clinical.png" alt="Clínica" class="img-fluid anim-float-slow"></div>
                <h3>Eficacia Clínica Elevada</h3>
              </div>
              <div class="vb-items">
                <div class="vb-item">
                  <div class="vb-dot"></div>
                  <div>
                    <strong>Baterías y Tests Integrados</strong>
                    <p>Aplica, califica y obtén métricas automáticas al instante. Sin transcripción manual.</p>
                  </div>
                </div>
                <div class="vb-item">
                  <div class="vb-dot"></div>
                  <div>
                    <strong>Simuladores de Decisión</strong>
                    <p>Herramientas de apoyo para el análisis de casos complejos y toma de decisiones clínicas.</p>
                  </div>
                </div>
                <div class="vb-item">
                  <div class="vb-dot"></div>
                  <div>
                    <strong>Análisis Global de Datos</strong>
                    <p>Identifica patrones académicos y clínicos en toda tu base de pacientes con gráficas automáticas.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Column 2: Continuidad Terapéutica -->
            <div class="value-block reveal delay-2">
              <div class="vb-header">
                <div class="vb-icon-box warm"><img src="assets/images/home/icon_continuity.png" alt="Continuidad" class="img-fluid anim-float-slow" style="animation-delay: -1.5s;"></div>
                <h3>Continuidad Terapéutica</h3>
              </div>
              <div class="vb-items">
                <div class="vb-item">
                  <div class="vb-dot warm"></div>
                  <div>
                    <strong>Entrenamientos y Tareas</strong>
                    <p>Genera actividades personalizadas directamente desde la plataforma y asígnalas a cada paciente.</p>
                  </div>
                </div>
                <div class="vb-item">
                  <div class="vb-dot warm"></div>
                  <div>
                    <strong>Monitoreo en Tiempo Real</strong>
                    <p>Supervisa el progreso y cumplimiento de tus consultantes a través de su propia App móvil.</p>
                  </div>
                </div>
                <div class="vb-item">
                  <div class="vb-dot warm"></div>
                  <div>
                    <strong>Registro Emocional</strong>
                    <p>Tus pacientes registran su estado emocional diario. Tú lo ves en gráficas dentro de tu panel.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════ -->
      <!-- 4. GESTIÓN EN UN CLIC -->
      <!-- ══════════════════════════════════════ -->
      <section class="ops-section" id="gestion">
        <div class="section-inner">
          <div class="section-header reveal">
            <span class="section-tag">Organización sin fricciones</span>
            <h2>Gestión en <span class="gradient-text">un clic.</span></h2>
            <p class="section-desc">
              Diseñado para ser amigable, reduciendo la carga administrativa
              para que te concentres en lo que importa: la terapia.
            </p>
          </div>

          <div class="ops-grid">
            <div class="ops-card reveal-scale delay-1" *ngFor="let item of opsFeatures; let i = index"
                 [style.animationDelay]="(i * 80) + 'ms'">
              <div class="ops-card-icon">{{ item.icon }}</div>
              <h4>{{ item.title }}</h4>
              <p>{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════ -->
      <!-- 5. COMPARATIVA -->
      <!-- ══════════════════════════════════════ -->
      <section class="compare-section" id="comparativa">
        <div class="section-inner">
          <div class="section-header reveal">
            <span class="section-tag">La diferencia real</span>
            <h2>Beneficios para <span class="gradient-text">el profesional.</span></h2>
          </div>

          <div class="compare-table reveal delay-1">
            <div class="compare-header">
              <div class="ch-col ch-left">Lo que haces hoy</div>
              <div class="ch-col ch-right">Con PsicoRuta</div>
            </div>
            <div class="compare-row" *ngFor="let row of compareRows; let i = index"
                 [style.animationDelay]="(i * 100) + 'ms'">
              <div class="cr-before">
                <span class="cr-icon before">✕</span>
                <span>{{ row.before }}</span>
              </div>
              <div class="cr-arrow">→</div>
              <div class="cr-after">
                <span class="cr-icon after">✓</span>
                <span>{{ row.after }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════ -->
      <!-- 6. CTA FINAL -->
      <!-- ══════════════════════════════════════ -->
      <section class="final-cta">
        <div class="section-inner reveal">
          <div class="cta-glow"></div>
          <div class="cta-icon-wrapper">
            <img src="assets/images/home/icon_spark.png" alt="Spark" class="cta-spark anim-pulse anim-float-slow">
          </div>
          <h2>Transforma tu práctica<br>profesional <span class="gradient-text">hoy mismo.</span></h2>
          <p>
            Únete a los psicólogos que ya están llevando su consulta al siguiente nivel
            con datos reales y procesos optimizados.
          </p>
          <a class="btn-primary-lg" routerLink="/welcome">
            Probar PsicoRuta ahora
            <span class="btn-arrow">→</span>
          </a>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="landing-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <img src="assets/images/brand/logo-color-horizontal.png" alt="PsicoRuta" class="footer-brand-logo" />
            <span class="footer-tagline">Inteligencia para tu Consulta</span>
          </div>
          <div class="footer-links">
            <a href="#diferencia">Nuestra Diferencia</a>
            <a href="#valor">Valor Clínico</a>
            <a href="#gestion">Gestión</a>
          </div>
          <p class="footer-copy">© 2026 PsicoRuta · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  `,
  styleUrl: 'home.scss',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private observer: IntersectionObserver | null = null;
  private scrollHandler: (() => void) | null = null;

  scrolled = signal(false);
  mobileMenu = signal(false);

  opsFeatures = [
    {
      icon: '📅',
      title: 'Agendamiento Inteligente',
      desc: 'Control total de tu calendario clínico en una interfaz intuitiva. Citas, sesiones y recordatorios en un solo lugar.'
    },
    {
      icon: '💰',
      title: 'Cobros y Facturación',
      desc: 'Registra pagos, genera recibos y mantén el control financiero de tu consulta sin complicaciones.'
    },
    {
      icon: '📄',
      title: 'Documentación Ágil',
      desc: 'Historias clínicas completas y seguras, listas para descargar o gestionar con un solo clic.'
    },
    {
      icon: '🎨',
      title: 'Personalización Total',
      desc: 'Adapta colores, terminología y módulos activos a tu práctica. Tu plataforma, tus reglas.'
    },
    {
      icon: '🔒',
      title: 'Seguridad Clínica',
      desc: 'Datos cifrados, acceso autenticado y cumplimiento de estándares de confidencialidad profesional.'
    },
    {
      icon: '📊',
      title: 'Reportes Automáticos',
      desc: 'Genera informes de progreso, estadísticas de consulta y análisis demográficos en segundos.'
    },
  ];

  compareRows = [
    {
      before: 'Calificación manual de pruebas psicológicas.',
      after: 'Resultados y métricas automáticas al instante.'
    },
    {
      before: 'Seguimiento incierto entre sesiones.',
      after: 'App para el paciente con tareas claras y monitoreo.'
    },
    {
      before: 'Datos dispersos en carpetas y hojas de cálculo.',
      after: 'Análisis de patrones y gráficas globales en tiempo real.'
    },
    {
      before: 'Gestión administrativa pesada y manual.',
      after: 'Todo resuelto en un solo clic: agenda, cobros, expedientes.'
    },
  ];

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('revealed');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );

    const targets = this.el.nativeElement.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    );
    targets.forEach((el: Element) => this.observer?.observe(el));

    // Scroll listener for nav
    this.scrollHandler = () => {
      this.scrolled.set(window.scrollY > 30);
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }
}
