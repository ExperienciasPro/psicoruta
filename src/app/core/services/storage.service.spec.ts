import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
    // Asegurarse de limpiar localStorage antes de cada prueba
    service.clear(true);
  });

  afterEach(() => {
    service.clear(true);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get items correctly', () => {
    const testData = { name: 'PsicoRuta', active: true };
    service.set('um_test_key', testData);
    
    const retrieved = service.get<typeof testData>('um_test_key');
    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent key', () => {
    const retrieved = service.get('um_non_existent');
    expect(retrieved).toBeNull();
  });

  it('should remove items correctly', () => {
    service.set('um_test_key_remove', 'value');
    expect(service.has('um_test_key_remove')).toBe(true);

    service.remove('um_test_key_remove');
    expect(service.has('um_test_key_remove')).toBe(false);
  });

  it('should clear only non-protected keys by default', () => {
    service.set('um_normal_key', 'normal');
    service.set('um_users', 'users_data'); // Protected key

    service.clear(false);

    expect(service.has('um_normal_key')).toBe(false);
    expect(service.has('um_users')).toBe(true);
  });

  it('should clear protected keys when includeProtected is true', () => {
    service.set('um_normal_key', 'normal');
    service.set('um_users', 'users_data'); // Protected key

    service.clear(true);

    expect(service.has('um_normal_key')).toBe(false);
    expect(service.has('um_users')).toBe(false);
  });
});
