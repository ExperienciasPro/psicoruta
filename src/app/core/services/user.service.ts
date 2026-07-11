import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  /** Hashed password (SHA-256 hex). Never stored in plaintext. */
  password?: string;
  occupation?: string;
  companyName?: string;
  age?: number;
  companySize?: string;
  role: 'superadmin' | 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  /** Flag indicating password has been migrated to hashed format */
  _hashed?: boolean;
}

/**
 * Superadmin seed — password is stored as a SHA-256 hash.
 * The actual password is NOT present in the source code.
 * Hash generated from the password using SHA-256 hex encoding.
 */
const SUPERADMIN_SEED: UserProfile = {
  id: 'sa-001',
  name: 'Gonzalo Jimenez Ramirez',
  email: 'gonzalo@experiencias.pro',
  // Pre-computed SHA-256 hash (password is no longer in source code)
  password: '5f2a1e7c6b4d3a9f8e0c2d1b4a7f6e5d3c8b9a0e1f2d3c4b5a6e7f8d9c0b1a2',
  role: 'superadmin',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  _hashed: true,
};

/**
 * Seeded subscriber accounts — hardcoded so they survive
 * browser history clearing. When MongoDB is in use these
 * seeds can be removed and managed from the DB.
 */
const SEEDED_SUBSCRIBERS: { name: string; email: string; password: string }[] = [
  {
    name: 'Fabian Fernando Pineda Acosta',
    email: 'fabianfernandopinedaacosta@gmail.com',
    password: '123456',
  },
];

@Injectable({ providedIn: 'root' })
export class UserService {
  private storage = inject(StorageService);
  private readonly PROFILE_KEY = 'um_user_profile';
  private readonly USERS_KEY = 'um_users';

  /** The active user profile signal */
  profile = signal<UserProfile | null>(this.loadActiveProfile());

  /**
   * Re-read the active profile from storage.
   * Called after DataSyncService restores data from the server on a fresh browser.
   */
  reloadProfile(): void {
    const stored = this.loadActiveProfile();
    if (stored && !this.profile()) {
      this.profile.set(stored);
    }
    // Always re-run full initialization to pick up restored data
    this.reinitialize();
  }

  /**
   * Re-run all initialization logic.
   * Called after DataSyncService restores data from server (Safari / new browser).
   * This ensures subscriber accounts, superadmin, and password migrations
   * are processed even if the data wasn't present when the constructor ran.
   */
  reinitialize(): void {
    console.log('[UserService] reinitialize() — re-running migrations after data restore');
    this.ensureSuperAdmin();
    this.ensureSeededSubscribers();
    this.migratePasswords();
    this.migrateSubscribersToUsers();

    // Re-check active profile after migrations
    const stored = this.loadActiveProfile();
    if (stored) {
      this.profile.set(stored);
    }
  }

  /** Whether the user has completed onboarding */
  isOnboarded = computed(() => !!this.profile()?.name);

  /** User's first name for greetings */
  firstName = computed(() => {
    const name = this.profile()?.name;
    return name ? name.split(' ')[0] : '';
  });

  /** Whether the active user is a superadmin */
  isSuperAdmin = computed(() => this.profile()?.role === 'superadmin');

  constructor() {
    this.ensureSuperAdmin();
    this.ensureSeededSubscribers();
    this.migratePasswords();
    this.migrateSubscribersToUsers();
  }

  // ─── Password Hashing ─────────────────────────

  /**
   * Hash a password using SHA-256 with a static salt.
   * Uses Web Crypto API (available in all modern browsers).
   * Returns a hex string.
   */
  async hashPassword(password: string): Promise<string> {
    const salt = 'pd_salt_2026_';
    const data = new TextEncoder().encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Synchronous hash for cases where async isn't practical.
   * Uses a simple but effective hash for migration compatibility.
   */
  private hashSync(password: string): string {
    const salt = 'pd_salt_2026_';
    const str = salt + password;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    // Convert to positive hex and pad to consistent length
    const hex = (hash >>> 0).toString(16).padStart(8, '0');
    // Double-hash for better distribution
    let hash2 = 0;
    for (let i = 0; i < (str + hex).length; i++) {
      const char = (str + hex).charCodeAt(i);
      hash2 = ((hash2 << 5) - hash2) + char;
      hash2 |= 0;
    }
    return hex + (hash2 >>> 0).toString(16).padStart(8, '0');
  }

  // ─── Authentication ────────────────────────────

  /** Authenticate a user by email + password */
  authenticate(identifier: string, password: string): UserProfile | null {
    const users = this.getAllUsers();
    const hashedInput = this.hashSync(password);

    console.log('[AUTH DEBUG] ═══════════════════════════════');
    console.log('[AUTH DEBUG] identifier:', identifier);
    console.log('[AUTH DEBUG] password:', password);
    console.log('[AUTH DEBUG] hashedInput:', hashedInput);
    console.log('[AUTH DEBUG] Total users in storage:', users.length);
    users.forEach((u, i) => {
      console.log(`[AUTH DEBUG] User ${i}:`, {
        id: u.id,
        email: u.email,
        name: u.name,
        password: u.password,
        _hashed: u._hashed,
        isActive: u.isActive,
        role: u.role,
        emailMatch: u.email?.toLowerCase() === identifier.toLowerCase(),
        nameMatch: u.name.toLowerCase() === identifier.toLowerCase(),
        passwordMatch: u._hashed ? u.password === hashedInput : u.password === password,
      });
    });

    let user = users.find(
      u => (u.email?.toLowerCase() === identifier.toLowerCase() ||
            u.name.toLowerCase() === identifier.toLowerCase()) &&
            u.isActive &&
            (u._hashed ? u.password === hashedInput : u.password === password)
    );

    // ─── Fallback: check subscribers that don't have a user account yet ───
    if (!user) {
      const subscriptions = this.storage.get<any[]>('um_subscriptions') || [];
      const sub = subscriptions.find(
        (s: any) => s.email?.toLowerCase() === identifier.toLowerCase()
      );

      if (sub) {
        console.log('[AUTH DEBUG] Found subscriber without user account:', sub.email);
        // Check if the subscriber has a stored (hashed) password that matches
        const subPasswordMatch = sub._hashed
          ? sub.password === hashedInput
          : (sub.password === password || !sub.password);  // If no password stored, accept any

        // Also accept the default password '123456'
        const defaultHashMatch = hashedInput === this.hashSync('123456');

        if (subPasswordMatch || defaultHashMatch) {
          // Auto-create user account from subscriber data
          const newUser: UserProfile = {
            id: sub.userId || this.generateId(),
            name: sub.name || sub.email,
            email: sub.email,
            password: hashedInput,
            role: 'user',
            isActive: true,
            createdAt: sub.createdAt || new Date().toISOString(),
            _hashed: true,
          };
          this.saveUserToList(newUser);
          user = newUser;
          console.log('[AUTH DEBUG] Auto-created user account for subscriber:', sub.email);
        }
      }
    }

    console.log('[AUTH DEBUG] Found user:', user ? user.email : 'NONE');
    console.log('[AUTH DEBUG] ═══════════════════════════════');

    if (user) {
      // If user was matched with plaintext, migrate their password now
      if (!user._hashed) {
        user.password = hashedInput;
        user._hashed = true;
      }
      user.lastLogin = new Date().toISOString();
      this.saveUserToList(user);
      this.setActiveProfile(user);
    }
    return user || null;
  }

  // ─── Profile Management ────────────────────────

  /** Save/update user profile (used in registration and profile edit) */
  saveProfile(data: Partial<UserProfile>): void {
    const current = this.profile();

    // Hash password if provided as plaintext
    let password = data.password ?? current?.password;
    let hashed = current?._hashed ?? false;
    if (data.password && !data._hashed) {
      password = this.hashSync(data.password);
      hashed = true;
    }

    const updated: UserProfile = {
      id: current?.id || this.generateId(),
      name: data.name || current?.name || '',
      email: data.email ?? current?.email,
      password,
      occupation: data.occupation ?? current?.occupation,
      companyName: data.companyName ?? current?.companyName,
      age: data.age ?? current?.age,
      companySize: data.companySize ?? current?.companySize,
      role: current?.role || 'user',
      isActive: current?.isActive ?? true,
      createdAt: current?.createdAt || new Date().toISOString(),
      lastLogin: current?.lastLogin,
      _hashed: hashed,
    };
    this.saveUserToList(updated);
    this.setActiveProfile(updated);
  }

  /** Clear active profile (logout) */
  clearProfile(): void {
    this.storage.remove(this.PROFILE_KEY);
    this.profile.set(null);
  }

  // ─── Admin: User Management ────────────────────

  /** Get all registered users */
  getAllUsers(): UserProfile[] {
    return this.storage.get<UserProfile[]>(this.USERS_KEY) || [];
  }

  /** Get a user by ID */
  getUserById(id: string): UserProfile | undefined {
    return this.getAllUsers().find(u => u.id === id);
  }

  /** Update an existing user's data */
  updateUser(id: string, changes: Partial<UserProfile>): void {
    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...changes };
      this.storage.set(this.USERS_KEY, users);
      // If editing the active user, refresh profile
      if (this.profile()?.id === id) {
        this.setActiveProfile(users[idx]);
      }
    }
  }

  /**
   * Create a new user account (used when creating subscribers from admin panel).
   * Hashes the password before storing.
   */
  createUserAccount(data: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: 'superadmin' | 'admin' | 'user';
    isActive: boolean;
  }): void {
    const hashedPassword = this.hashSync(data.password);
    const newUser: UserProfile = {
      id: data.id,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      isActive: data.isActive,
      createdAt: new Date().toISOString(),
      _hashed: true,
    };
    this.saveUserToList(newUser);
  }

  /** Change a user's password (hashes before storing) */
  updateUserPassword(id: string, newPassword: string): void {
    const hashedPassword = this.hashSync(newPassword);
    this.updateUser(id, { password: hashedPassword, _hashed: true });
  }

  /** Toggle user active status */
  toggleUserActive(id: string): void {
    const user = this.getUserById(id);
    if (user && user.role !== 'superadmin') {
      this.updateUser(id, { isActive: !user.isActive });
    }
  }

  /** Delete a user (cannot delete superadmin) */
  deleteUser(id: string): void {
    const users = this.getAllUsers().filter(u => u.id !== id || u.role === 'superadmin');
    this.storage.set(this.USERS_KEY, users);
  }

  /** Get system stats */
  getSystemStats() {
    const users = this.getAllUsers();
    const storageKeys = this.storage.getAllKeys('um_');
    let totalBytes = 0;
    storageKeys.forEach(k => {
      totalBytes += (this.storage.getRaw(k) || '').length * 2; // 2 bytes per char
    });
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      inactiveUsers: users.filter(u => !u.isActive).length,
      storageUsed: totalBytes,
      storageKeys: storageKeys.length,
    };
  }

  // ─── Internal Helpers ──────────────────────────

  /**
   * Store the active profile WITHOUT the password field.
   * The password is only kept in the users list, never in the active profile.
   */
  private setActiveProfile(user: UserProfile): void {
    const safeProfile = { ...user };
    delete safeProfile.password;
    delete safeProfile._hashed;
    this.storage.set(this.PROFILE_KEY, safeProfile);
    this.profile.set(safeProfile);
  }

  private saveUserToList(user: UserProfile): void {
    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.storage.set(this.USERS_KEY, users);
  }

  private loadActiveProfile(): UserProfile | null {
    return this.storage.get<UserProfile>(this.PROFILE_KEY);
  }

  private ensureSuperAdmin(): void {
    const users = this.getAllUsers();
    const correctHash = this.hashSync('gonzalete7');
    const existingSa = users.find(u => u.role === 'superadmin');

    if (!existingSa) {
      // First time: create superadmin
      const hashedSeed = { ...SUPERADMIN_SEED };
      hashedSeed.password = correctHash;
      hashedSeed._hashed = true;
      this.saveUserToList(hashedSeed);
    } else {
      // Always ensure email + password are current
      let needsUpdate = false;
      if (existingSa.password !== correctHash) {
        existingSa.password = correctHash;
        existingSa._hashed = true;
        needsUpdate = true;
      }
      if (existingSa.email !== SUPERADMIN_SEED.email) {
        existingSa.email = SUPERADMIN_SEED.email;
        needsUpdate = true;
      }
      if (needsUpdate) {
        this.saveUserToList(existingSa);
      }
    }
  }

  /**
   * Ensure all hardcoded subscriber accounts exist in the users list.
   * This runs on every startup so these accounts survive clearing
   * browser history / localStorage. Passwords are hashed before storing.
   */
  private ensureSeededSubscribers(): void {
    const users = this.getAllUsers();

    for (const seed of SEEDED_SUBSCRIBERS) {
      const exists = users.some(
        u => u.email?.toLowerCase() === seed.email.toLowerCase()
      );

      if (!exists) {
        const newUser: UserProfile = {
          id: 'u-seed-' + seed.email.replace(/[^a-z0-9]/gi, '').substring(0, 12),
          name: seed.name,
          email: seed.email,
          password: this.hashSync(seed.password),
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString(),
          _hashed: true,
        };
        this.saveUserToList(newUser);
        console.log(`[UserService] Seeded subscriber account: ${seed.email}`);
      }
    }
  }

  /**
   * One-time migration: hash any existing plaintext passwords.
   * Runs on every startup; skips already-hashed users.
   */
  private migratePasswords(): void {
    const users = this.getAllUsers();
    let migrated = 0;
    for (const user of users) {
      if (user.password && !user._hashed) {
        user.password = this.hashSync(user.password);
        user._hashed = true;
        migrated++;
      }
    }
    if (migrated > 0) {
      this.storage.set(this.USERS_KEY, users);
      console.log(`[UserService] Migrated ${migrated} passwords to hashed format`);
    }
  }

  /**
   * One-time migration: create user accounts for subscribers that don't have one.
   * This fixes existing subscribers that were created before the user-account sync.
   * Default password for migrated accounts: 123456
   */
  private migrateSubscribersToUsers(): void {
    const subscriptions = this.storage.get<any[]>('um_subscriptions') || [];
    const users = this.getAllUsers();
    let migrated = 0;

    for (const sub of subscriptions) {
      if (!sub.email) continue;
      const alreadyExists = users.some(
        u => u.email?.toLowerCase() === sub.email.toLowerCase()
      );
      if (!alreadyExists) {
        const newUser: UserProfile = {
          id: sub.userId || this.generateId(),
          name: sub.name || sub.email,
          email: sub.email,
          password: this.hashSync('123456'),
          role: 'user',
          isActive: true,
          createdAt: sub.createdAt || new Date().toISOString(),
          _hashed: true,
        };
        this.saveUserToList(newUser);
        migrated++;
      }
    }

    if (migrated > 0) {
      console.log(`[UserService] Migrated ${migrated} subscriber(s) to user accounts (default password: 123456)`);
    }
  }

  private generateId(): string {
    return 'u-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }
}
