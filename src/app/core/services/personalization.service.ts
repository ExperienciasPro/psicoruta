import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

// ─── Paletas de color predefinidas ─────────────────
export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  bgPrimary: string;
  bgSecondary: string;
  accentPrimary: string;
  accentSecondary: string;
  textPrimary: string;
  textSecondary: string;
  preview: string[];  // 4 colores para preview visual
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'psicoruta-brand',
    name: 'PsicoRuta Oficial',
    description: 'Azul profundo, verde esmeralda y celeste — la identidad de marca',
    bgPrimary: '#f4f1ec', bgSecondary: '#EBE7E0',
    accentPrimary: '#084983', accentSecondary: '#009fe3',
    textPrimary: '#084983', textSecondary: '#3A6A8E',
    preview: ['#f4f1ec', '#084983', '#009fe3', '#22d577']
  },
  {
    id: 'lavender-gold',
    name: 'Lavanda & Oro',
    description: 'Púrpura suave con acentos dorados — serenidad y sofisticación',
    bgPrimary: '#FAFAF8', bgSecondary: '#F0EEF5',
    accentPrimary: '#8B7EB8', accentSecondary: '#C9A96E',
    textPrimary: '#3D3A50', textSecondary: '#6E6B80',
    preview: ['#F0EEF5', '#8B7EB8', '#C9A96E', '#3D3A50']
  },
  {
    id: 'ocean-coral',
    name: 'Océano & Coral',
    description: 'Azul profundo con coral — profesionalismo con calidez',
    bgPrimary: '#F8FBFC', bgSecondary: '#EEF3F5',
    accentPrimary: '#5B8A9A', accentSecondary: '#D4836B',
    textPrimary: '#2C3E50', textSecondary: '#5D6D7E',
    preview: ['#EEF3F5', '#5B8A9A', '#D4836B', '#2C3E50']
  },
  {
    id: 'earth-moss',
    name: 'Tierra & Musgo',
    description: 'Tonos naturales y verdes profundos — conexión con la naturaleza',
    bgPrimary: '#FAF9F5', bgSecondary: '#F0EDE5',
    accentPrimary: '#6B7F5E', accentSecondary: '#B8956A',
    textPrimary: '#3A3D34', textSecondary: '#6B6E64',
    preview: ['#F0EDE5', '#6B7F5E', '#B8956A', '#3A3D34']
  },
  {
    id: 'blush-charcoal',
    name: 'Rubor & Carbón',
    description: 'Rosa empolvado con grafito — feminidad elegante y moderna',
    bgPrimary: '#FDF9F8', bgSecondary: '#F5EFED',
    accentPrimary: '#C4919B', accentSecondary: '#8B8178',
    textPrimary: '#3B3336', textSecondary: '#706468',
    preview: ['#F5EFED', '#C4919B', '#8B8178', '#3B3336']
  },
  {
    id: 'nordic-frost',
    name: 'Nórdico Frost',
    description: 'Azules gélidos y grises claros — claridad mental escandinava',
    bgPrimary: '#F8FAFB', bgSecondary: '#EDF1F4',
    accentPrimary: '#7BA0B5', accentSecondary: '#A3B5C0',
    textPrimary: '#2F3E46', textSecondary: '#5C6B73',
    preview: ['#EDF1F4', '#7BA0B5', '#A3B5C0', '#2F3E46']
  },
  {
    id: 'sky-sand',
    name: 'Cielo & Arena',
    description: 'Azul cielo vibrante con arena cálida — frescura y confianza',
    bgPrimary: '#F9FCFE', bgSecondary: '#EEF6FB',
    accentPrimary: '#33B5E5', accentSecondary: '#D4A373',
    textPrimary: '#2C3E50', textSecondary: '#5D6D7E',
    preview: ['#EEF6FB', '#33B5E5', '#D4A373', '#2C3E50']
  }
];

// ─── Terminología del cliente ──────────────────────
export interface ClientTerminology {
  id: string;
  singular: string;
  plural: string;
  description: string;
}

export const CLIENT_TERMINOLOGIES: ClientTerminology[] = [
  { id: 'consultante', singular: 'Consultante', plural: 'Consultantes', description: 'Enfoque colaborativo — el profesional acompaña al consultante' },
  { id: 'paciente', singular: 'Paciente', plural: 'Pacientes', description: 'Enfoque clínico — modelo médico tradicional' },
  { id: 'cliente', singular: 'Cliente', plural: 'Clientes', description: 'Enfoque humanista / coaching — relación horizontal' },
  { id: 'usuario', singular: 'Usuario', plural: 'Usuarios', description: 'Enfoque institucional — servicios de salud pública' },
  { id: 'analizante', singular: 'Analizante', plural: 'Analizantes', description: 'Enfoque psicoanalítico — la persona que se analiza' },
  { id: 'coachee', singular: 'Coachee', plural: 'Coachees', description: 'Enfoque de coaching — desarrollo personal y profesional' },
];

// ─── Duraciones de sesión ──────────────────────────
export const SESSION_DURATIONS = [30, 45, 50, 60, 75, 90, 120];

// ─── Monedas ───────────────────────────────────────
export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño' },
];

// ─── Modelo de preferencias ────────────────────────
export interface AppPreferences {
  colorPaletteId: string;
  clientTerminologyId: string;
  defaultSessionMinutes: number;
  currencyCode: string;
  practiceName: string;
  professionalTitle: string;
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  startOfWeek: 'monday' | 'sunday';
  showWelcomeMessage: boolean;
  welcomeMessage: string;
  compactSidebar: boolean;
  showQuickActions: boolean;
  autoSaveInterval: number; // minutes
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
}

const DEFAULT_PREFERENCES: AppPreferences = {
  colorPaletteId: 'psicoruta-brand',
  clientTerminologyId: 'consultante',
  defaultSessionMinutes: 50,
  currencyCode: 'COP',
  practiceName: '',
  professionalTitle: 'Psicólogo/a',
  dateFormat: 'dd/MM/yyyy',
  startOfWeek: 'monday',
  showWelcomeMessage: true,
  welcomeMessage: '¡Bienvenido/a! Tienes un día productivo por delante.',
  compactSidebar: false,
  showQuickActions: true,
  autoSaveInterval: 5,
  fontSize: 'medium',
};

@Injectable({ providedIn: 'root' })
export class PersonalizationService {
  private storage = inject(StorageService);
  private readonly KEY = 'pd_preferences';

  /** Reactive preferences signal */
  preferences = signal<AppPreferences>(this.load());

  /** Derived signals for common lookups */
  activePalette = computed(() => {
    const id = this.preferences().colorPaletteId;
    return COLOR_PALETTES.find(p => p.id === id) || COLOR_PALETTES[0];
  });

  activeTerminology = computed(() => {
    const id = this.preferences().clientTerminologyId;
    return CLIENT_TERMINOLOGIES.find(t => t.id === id) || CLIENT_TERMINOLOGIES[0];
  });

  activeCurrency = computed(() => {
    const code = this.preferences().currencyCode;
    return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
  });

  /** Client term helpers */
  clientSingular = computed(() => this.activeTerminology().singular);
  clientPlural = computed(() => this.activeTerminology().plural);

  constructor() {
    // Apply palette on init
    this.applyPalette(this.activePalette());
    this.applyFontSize(this.preferences().fontSize);
  }

  private load(): AppPreferences {
    const stored = this.storage.get<Partial<AppPreferences>>(this.KEY);
    return { ...DEFAULT_PREFERENCES, ...(stored || {}) };
  }

  /** Update a single preference field */
  update<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]): void {
    const next = { ...this.preferences(), [key]: value };
    this.preferences.set(next);
    this.storage.set(this.KEY, next);

    // If palette changed, apply it live
    if (key === 'colorPaletteId') {
      const palette = COLOR_PALETTES.find(p => p.id === value) || COLOR_PALETTES[0];
      this.applyPalette(palette);
    }

    // If font size changed, apply it live
    if (key === 'fontSize') {
      this.applyFontSize(value as string);
    }
  }

  /** Update multiple fields at once */
  updateMany(partial: Partial<AppPreferences>): void {
    const next = { ...this.preferences(), ...partial };
    this.preferences.set(next);
    this.storage.set(this.KEY, next);

    if (partial.colorPaletteId) {
      const palette = COLOR_PALETTES.find(p => p.id === partial.colorPaletteId) || COLOR_PALETTES[0];
      this.applyPalette(palette);
    }
  }

  /** Reset to defaults */
  reset(): void {
    this.preferences.set({ ...DEFAULT_PREFERENCES });
    this.storage.set(this.KEY, DEFAULT_PREFERENCES);
    this.applyPalette(COLOR_PALETTES[0]);
    this.applyFontSize('medium');
  }

  /** Apply palette colors to CSS custom properties (live theming) */
  private applyPalette(palette: ColorPalette): void {
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', palette.bgPrimary);
    root.style.setProperty('--bg-secondary', palette.bgSecondary);
    root.style.setProperty('--accent-primary', palette.accentPrimary);
    root.style.setProperty('--accent-secondary', palette.accentSecondary);
    root.style.setProperty('--text-primary', palette.textPrimary);
    root.style.setProperty('--text-secondary', palette.textSecondary);
    root.style.setProperty('--surface-secondary', palette.bgSecondary);
  }

  /** Apply font size scaling to the entire app */
  private applyFontSize(size: string): void {
    const map: Record<string, string> = {
      small: '13px',
      medium: '14px',
      large: '16px',
      xlarge: '18px',
    };
    document.documentElement.style.setProperty('--app-font-size', map[size] || '14px');
    document.documentElement.style.fontSize = map[size] || '14px';
  }
}
