import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { PersonalizationService } from '../../core/services/personalization.service';

interface AppModule {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  description: string;
  example: string;
  color: string;
}

interface ModuleCategory {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  modules: AppModule[];
}

@Component({
  selector: 'um-module-picker',
  standalone: true,
  imports: [],
  template: `
    <div class="picker-page">
      <div class="picker-bg">
        <div class="bg-orb orb-a"></div>
        <div class="bg-orb orb-b"></div>
      </div>

      <div class="picker-container">
        <header class="picker-header animate-up">
          <span class="header-icon">✨</span>
          <h1>Arma tu PsicoRuta</h1>
          <p class="picker-subtitle">
            Selecciona los módulos que necesitas hoy. Puedes activar o desactivar más adelante.
          </p>
          <div class="selected-count">
            <span class="count-badge" [class.has-selection]="selectedCount() > 0" [class.bump]="countBump()">
              {{ selectedCount() }} {{ selectedCount() === 1 ? 'módulo' : 'módulos' }}
            </span>
            seleccionados
          </div>
        </header>

        @for (cat of categories; track cat.id; let ci = $index) {
          <section class="category-block animate-up" [style.animation-delay.ms]="100 + ci * 80">
            <div class="category-header">
              <span class="category-icon">{{ cat.icon }}</span>
              <div>
                <h2 class="category-title">{{ cat.title }}</h2>
                <p class="category-subtitle">{{ cat.subtitle }}</p>
              </div>
              <button class="btn-select-all" (click)="selectCategory(cat)">
                {{ isCategoryFullySelected(cat) ? '✓ Todos activos' : 'Activar todos' }}
              </button>
            </div>

            <div class="modules-grid">
              @for (mod of cat.modules; track mod.id; let i = $index) {
                <div
                  class="module-card"
                  [class.selected]="isSelected(mod.id)"
                  [class.just-selected]="justSelected() === mod.id"
                  [style.--accent]="mod.color">

                  <div class="confetti-container">
                    <span class="confetti c1">✦</span>
                    <span class="confetti c2">●</span>
                    <span class="confetti c3">▲</span>
                    <span class="confetti c4">♦</span>
                    <span class="confetti c5">★</span>
                    <span class="confetti c6">●</span>
                    <span class="confetti c7">✦</span>
                    <span class="confetti c8">▲</span>
                  </div>

                  <button class="card-top" (click)="toggle(mod.id)">
                    <span class="card-icon">{{ mod.icon }}</span>
                    <div class="card-info">
                      <h3>{{ mod.name }}</h3>
                      <p class="card-tagline">{{ mod.tagline }}</p>
                    </div>
                    <div class="card-check">
                      @if (isSelected(mod.id)) {
                        <span class="check-icon">✓</span>
                      } @else {
                        <span class="check-empty"></span>
                      }
                    </div>
                  </button>

                  <div class="card-details">
                    <p class="card-desc">{{ mod.description }}</p>
                    <div class="card-example">
                      <span class="example-label">💡 Ejemplo:</span>
                      <span class="example-text">{{ mod.example }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <div class="picker-footer animate-up" style="animation-delay: 600ms">
          <p class="footer-hint">No te preocupes, podrás cambiar tu selección cuando quieras.</p>
          <button
            class="btn-continue"
            [disabled]="selectedCount() === 0"
            (click)="continue()">
            Comenzar con {{ selectedCount() }} {{ selectedCount() === 1 ? 'módulo' : 'módulos' }}
            <span class="btn-arrow">→</span>
          </button>
          <button class="btn-skip" (click)="skipAll()">
            Activar todos y explorar
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: 'module-picker.scss',
})
export class ModulePickerComponent {
  private router = inject(Router);
  private storage = inject(StorageService);
  private pz = inject(PersonalizationService);

  selected = signal<Set<string>>(new Set());
  justSelected = signal<string | null>(null);
  countBump = signal(false);

  selectedCount = () => this.selected().size;

  categories: ModuleCategory[] = [
    {
      id: 'health',
      icon: '⚕️',
      title: 'Clínica & Consulta',
      subtitle: 'Gestión integral de tu práctica clínica',
      modules: [
        {
          id: 'clinica',
          icon: '🏥',
          name: this.pz.clientPlural(),
          tagline: `Gestión de ${this.pz.clientPlural().toLowerCase()} e historiales`,
          description: `Historial clínico digital, gestión de ${this.pz.clientPlural().toLowerCase()} y seguimiento de tratamientos terapéuticos.`,
          example: 'Abres la ficha de un paciente y ves sus notas de la sesión anterior.',
          color: '#e74c3c',
        },
        {
          id: 'agenda',
          icon: '📅',
          name: 'Agenda',
          tagline: 'Tu calendario clínico',
          description: 'Calendario de citas, sesiones y recordatorios. Control total de tu jornada clínica.',
          example: 'Programas las citas de la semana y recibes recordatorios antes de cada sesión.',
          color: '#3498db',
        },
        {
          id: 'clinica_analytics',
          icon: '📈',
          name: 'Analítica Clínica',
          tagline: 'Ciencia de datos clínicos',
          description: 'Cruza diagnósticos, demografía y evaluaciones para descubrir patrones y tendencias en tus consultantes.',
          example: 'Descubres una correlación entre un perfil demográfico y la efectividad de una terapia.',
          color: '#2980b9',
        },
      ],
    },
    {
      id: 'strategy',
      icon: '🚀',
      title: 'Estrategia & Seguimiento',
      subtitle: 'Define tu rumbo y mide tu progreso',
      modules: [
        {
          id: 'goals',
          icon: '🎯',
          name: 'Banco de Tareas Terapéuticas',
          tagline: 'Tareas clínicas reutilizables',
          description: 'Crea y gestiona tareas terapéuticas con instrucciones, pasos y seguimiento de progreso.',
          example: 'Creas la tarea "Respiración diafragmática" con instrucciones paso a paso para asignar a entrenamientos.',
          color: '#e67e22',
        },
        {
          id: 'projects',
          icon: '📋',
          name: 'Proyectos Clínicos',
          tagline: 'Programas, talleres e investigaciones',
          description: 'Gestiona proyectos clínicos, talleres grupales e investigaciones con tableros de tareas.',
          example: 'Organizas un taller de habilidades sociales con todas las tareas y materiales en un solo lugar.',
          color: '#9b59b6',
        },
        {
          id: 'analytics',
          icon: '📊',
          name: 'Analítica de Práctica',
          tagline: 'KPIs consolidados',
          description: 'Dashboard con indicadores clave de tu actividad profesional: consultas, tendencias y productividad.',
          example: 'Visualizas cuántas sesiones realizaste este mes vs. el anterior.',
          color: '#16a085',
        },
        {
          id: 'coach',
          icon: '📱',
          name: 'Coach Móvil',
          tagline: 'Prioridades del día en tu bolsillo',
          description: 'Vista optimizada para móvil con las metas del día, tareas pendientes y accesos rápidos.',
          example: 'Revisas tus prioridades del día desde el celular antes de llegar al consultorio.',
          color: '#8e44ad',
        },
      ],
    },
    {
      id: 'evaluacion',
      icon: '🧪',
      title: 'Evaluación & Diagnóstico',
      subtitle: 'Instrumentos y análisis de datos',
      modules: [
        {
          id: 'tests',
          icon: '🧪',
          name: 'Tests & Evaluaciones',
          tagline: 'Instrumentos psicológicos integrados',
          description: 'Aplica evaluaciones psicotécnicas, tests psicológicos y baterías integradas al expediente del consultante.',
          example: 'Aplicas un BDI-II a tu paciente y los resultados se guardan automáticamente en su ficha.',
          color: '#e67e22',
        },
        {
          id: 'formularios',
          icon: '📝',
          name: 'Formularios Custom',
          tagline: 'Captura datos a tu medida',
          description: 'Crea formularios dinámicos para anamnesis, encuestas de satisfacción o reportes personalizados.',
          example: 'Diseñas un formulario de anamnesis personalizado para nuevos consultantes.',
          color: '#9b59b6',
        },
        {
          id: 'datos',
          icon: '🗄️',
          name: 'Base de Datos',
          tagline: 'Toda tu información centralizada',
          description: 'Repositorio centralizado de toda la información capturada a través de formularios y tests.',
          example: 'Descargas en Excel todas las respuestas recolectadas de tus instrumentos.',
          color: '#34495e',
        },
        {
          id: 'resultados',
          icon: '📊',
          name: 'Análisis de Datos',
          tagline: 'Inteligencia analítica',
          description: 'Cruza información de diferentes módulos para obtener insights profundos sobre tus evaluaciones.',
          example: 'Visualizas métricas poblacionales o gráficas de diagnósticos cruzados.',
          color: '#273c75',
        },
        {
          id: 'simulador',
          icon: '🧠',
          name: 'Simulador de Decisiones',
          tagline: 'Árboles de decisión clínica',
          description: 'Escenarios interactivos de árbol de decisión para análisis de casos complejos y toma de decisiones clínicas.',
          example: 'Modelas un árbol de decisión para determinar el mejor enfoque terapéutico según el perfil del paciente.',
          color: '#2c3e50',
        },
      ],
    },
    {
      id: 'tools',
      icon: '🛠️',
      title: 'Herramientas',
      subtitle: 'Complementos para tu práctica',
      modules: [
        {
          id: 'entrenamientos',
          icon: '🎓',
          name: 'Entrenamientos',
          tagline: 'Capacita y asigna material',
          description: 'Crea planes de capacitación, sube material de estudio y asigna entrenamientos terapéuticos a tus consultantes.',
          example: 'Asignas una guía de respiración diafragmática como tarea entre sesiones.',
          color: '#2ecc71',
        },
      ],
    },
  ];

  get modules(): AppModule[] {
    return this.categories.flatMap(c => c.modules);
  }

  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  toggle(id: string): void {
    const next = new Set(this.selected());
    const isAdding = !next.has(id);
    if (isAdding) {
      next.add(id);
      this.justSelected.set(id);
      this.countBump.set(true);
      setTimeout(() => this.justSelected.set(null), 700);
      setTimeout(() => this.countBump.set(false), 500);
    } else {
      next.delete(id);
    }
    this.selected.set(next);
  }

  isCategoryFullySelected(cat: ModuleCategory): boolean {
    return cat.modules.every(m => this.selected().has(m.id));
  }

  selectCategory(cat: ModuleCategory): void {
    const next = new Set(this.selected());
    const allSelected = this.isCategoryFullySelected(cat);
    cat.modules.forEach(m => {
      if (allSelected) {
        next.delete(m.id);
      } else {
        next.add(m.id);
      }
    });
    this.selected.set(next);
    if (!allSelected) {
      this.countBump.set(true);
      setTimeout(() => this.countBump.set(false), 500);
    }
  }

  continue(): void {
    this.saveAndNavigate();
  }

  skipAll(): void {
    const all = new Set(this.modules.map(m => m.id));
    this.selected.set(all);
    this.saveAndNavigate();
  }

  private saveAndNavigate(): void {
    let enabledModules = Array.from(this.selected());

    const dataTriggerModules = ['tests', 'encuestas', 'formularios'];
    const shouldEnableData = enabledModules.some(m => dataTriggerModules.includes(m));

    if (shouldEnableData) {
      if (!enabledModules.includes('datos')) enabledModules.push('datos');
      if (!enabledModules.includes('resultados')) enabledModules.push('resultados');
    }

    this.storage.set('um_enabled_modules', enabledModules);
    this.router.navigate(['/d/dashboard']);
  }
}
