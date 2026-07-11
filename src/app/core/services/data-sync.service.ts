import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';

/**
 * DataSyncService — PsicoRuta — Sincronización global de datos ↔ Servidor
 *
 * Este servicio respalda TODOS los datos de localStorage (claves um_*)
 * en el servidor PHP automáticamente. Esto garantiza que los datos
 * sobrevivan actualizaciones, limpieza de caché e incluso cambio de navegador.
 *
 * Estrategia:
 * 1. Al iniciar la app → carga datos del servidor y los mérgea con localStorage
 * 2. Cada vez que hay un cambio → sube los datos al servidor (debounced)
 * 3. Exportar/Importar backup como JSON
 */
@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private storage = inject(StorageService);
  private readonly API_URL = '/api/data';
  private readonly AUTH_TOKEN = environment.apiAuthToken;
  private readonly UM_PREFIX = 'um_';
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Todas las claves que se sincronizan */
  private getAllUmKeys(): string[] {
    return this.storage.getAllKeys(this.UM_PREFIX);
  }

  /** Recolecta todos los datos con prefijo um_ usando StorageService */
  private collectLocalData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const key of this.getAllUmKeys()) {
      try {
        const value = this.storage.get<unknown>(key);
        if (value !== null && value !== undefined) {
          data[key] = value;
        }
      } catch {
        // Ignorar claves con datos no-JSON
      }
    }
    return data;
  }

  /**
   * Sincroniza desde el servidor al abrir la app.
   * Mérgea datos del servidor con localStorage (servidor gana si local está vacío).
   */
  async syncFromServer(): Promise<boolean> {
    try {
      console.log('[DataSync] Sincronizando desde servidor...');
      const response = await fetch(`${this.API_URL}?key=_bulk`, {
        headers: { 'X-Auth-Token': this.AUTH_TOKEN },
      });

      if (!response.ok) {
        console.warn('[DataSync] Servidor respondió:', response.status);
        return false;
      }

      const serverData: Record<string, unknown> = await response.json();
      const serverKeys = Object.keys(serverData);

      if (serverKeys.length === 0) {
        // Servidor vacío → subir todo lo local
        console.log('[DataSync] Servidor vacío, subiendo datos locales');
        await this.saveToServer();
        return false;
      }

      console.log('[DataSync] Datos del servidor:', serverKeys.length, 'claves');

      // Mérgear: si una clave existe en servidor pero no en local, restaurarla
      let restoredCount = 0;
      for (const key of serverKeys) {
        const localValue = this.storage.get<unknown>(key);
        const isEmpty = localValue === null || localValue === undefined ||
          (Array.isArray(localValue) && localValue.length === 0) ||
          (typeof localValue === 'object' && localValue !== null && Object.keys(localValue).length === 0);

        if (isEmpty) {
          // Local vacío → restaurar desde servidor
          this.storage.set(key, serverData[key]);
          restoredCount++;
        }
      }

      if (restoredCount > 0) {
        console.log(`[DataSync] Restauradas ${restoredCount} claves desde el servidor`);
      }

      // También subir cualquier dato local que no esté en servidor
      const localData = this.collectLocalData();
      let newKeys = 0;
      for (const key of Object.keys(localData)) {
        if (!(key in serverData)) {
          newKeys++;
        }
      }

      if (newKeys > 0) {
        console.log(`[DataSync] ${newKeys} claves nuevas en local, sincronizando al servidor`);
        await this.saveToServer();
      }

      return restoredCount > 0;
    } catch (e) {
      console.warn('[DataSync] Error sincronizando:', e);
      return false;
    }
  }

  /**
   * Guarda TODOS los datos de localStorage al servidor.
   * Usa debounce para no hacer demasiadas peticiones.
   */
  saveToServerDebounced(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.saveToServer();
    }, 2000); // Esperar 2s antes de guardar
  }

  /** Guarda inmediatamente al servidor */
  async saveToServer(): Promise<void> {
    try {
      const data = this.collectLocalData();
      const keyCount = Object.keys(data).length;

      if (keyCount === 0) return;

      console.log(`[DataSync] Guardando ${keyCount} claves al servidor...`);
      const response = await fetch(`${this.API_URL}?key=_bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': this.AUTH_TOKEN,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('[DataSync] Respuesta:', result);
    } catch (e) {
      console.warn('[DataSync] Error guardando:', e);
    }
  }

  /** Exporta todos los datos como JSON para backup manual */
  exportBackup(): string {
    return JSON.stringify(this.collectLocalData(), null, 2);
  }

  /** Importa datos desde un backup JSON */
  importBackup(json: string): number {
    const data = JSON.parse(json);
    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(this.UM_PREFIX)) {
        this.storage.set(key, value);
        count++;
      }
    }
    // Sincronizar al servidor
    this.saveToServer();
    return count;
  }
}
