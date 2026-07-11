export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
}

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: 'Activa',
  [SubscriptionStatus.EXPIRED]: 'Expirada',
  [SubscriptionStatus.TRIAL]: 'Prueba',
  [SubscriptionStatus.SUSPENDED]: 'Suspendida',
};

export const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: '#00b894',
  [SubscriptionStatus.EXPIRED]: '#e84393',
  [SubscriptionStatus.TRIAL]: '#fdcb6e',
  [SubscriptionStatus.SUSPENDED]: '#636e72',
};

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.FREE]: 'Gratuito',
  [SubscriptionPlan.BASIC]: 'Básico',
  [SubscriptionPlan.PROFESSIONAL]: 'Profesional',
  [SubscriptionPlan.ENTERPRISE]: 'Empresarial',
};

export const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.FREE]: '#636e72',
  [SubscriptionPlan.BASIC]: '#0984e3',
  [SubscriptionPlan.PROFESSIONAL]: '#6c5ce7',
  [SubscriptionPlan.ENTERPRISE]: '#fdcb6e',
};

export const PLAN_STORAGE_LIMITS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 100,
  [SubscriptionPlan.BASIC]: 500,
  [SubscriptionPlan.PROFESSIONAL]: 2000,
  [SubscriptionPlan.ENTERPRISE]: 10000,
};

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  email: string;
  /** Hashed password — never stored in plaintext */
  password?: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  startDate: string;
  endDate: string;
  storageUsedMB: number;
  storageLimitMB: number;
  modules: string[];
  notes: string;
  createdAt: string;
  lastActivity: string;
}
