import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { DataSyncService } from '../../core/services/data-sync.service';
import { UmIconComponent } from '../../shared/components/um-icon/um-icon';

@Component({
  selector: 'um-login',
  standalone: true,
  imports: [FormsModule, RouterLink, UmIconComponent],
  template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
      </div>

      <div class="login-container">
        <a class="back-link" routerLink="/">
          ← Volver al inicio
        </a>

        <div class="login-brand animate-fadeInUp">
          <img src="assets/images/brand/logo-color-vertical.png" alt="PsicoRuta" class="login-brand-logo" />
        </div>

        <!-- ═══ LOGIN FORM ═══ -->
        @if (view === 'login') {
          <div class="login-card animate-fadeInUp stagger-1">
            <div class="card-top-bar"></div>
            <h2>Acceso Suscriptor</h2>
            <p class="login-subtitle">Ingresa con tu correo y contraseña</p>

            <form class="login-form" (ngSubmit)="login()">
              <div class="form-group">
                <label for="login-user">
                  <um-icon name="user" [size]="16"></um-icon>
                  Correo o usuario
                </label>
                <input
                  #usernameInput
                  id="login-user"
                  class="form-input"
                  type="text"
                  [(ngModel)]="username"
                  name="username"
                  autocomplete="username"
                  placeholder="Tu correo electrónico"
                  autofocus
                  required
                />
              </div>

              <div class="form-group">
                <label for="login-pass">
                  <um-icon name="settings" [size]="16"></um-icon>
                  Contraseña
                </label>
                <div class="password-wrap">
                  <input
                    #passwordInput
                    id="login-pass"
                    class="form-input"
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    autocomplete="current-password"
                    placeholder="Tu contraseña"
                    required
                  />
                  <button type="button" class="toggle-pass" (click)="showPassword = !showPassword" tabindex="-1">
                    {{ showPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>

              @if (errorMsg) {
                <p class="error-msg">{{ errorMsg }}</p>
              }

              <button
                type="submit"
                class="login-btn"
                [disabled]="!username.trim() || !password.trim()"
              >
                <um-icon name="bolt" [size]="20"></um-icon>
                Ingresar
              </button>
            </form>

            <button class="forgot-link" (click)="goToRecover()">
              🔑 ¿Olvidaste tu contraseña?
            </button>

            <p class="register-link">
              ¿No tienes cuenta?
              <a routerLink="/welcome">Regístrate aquí</a>
            </p>
          </div>
        }

        <!-- ═══ RECOVER: STEP 1 — ENTER EMAIL ═══ -->
        @if (view === 'recover-email') {
          <div class="login-card animate-fadeInUp">
            <div class="card-top-bar recover-bar"></div>
            <h2>🔑 Recuperar Contraseña</h2>
            <p class="login-subtitle">Ingresa el correo con el que te registraste</p>

            <form class="login-form" (ngSubmit)="verifyEmail()">
              <div class="form-group">
                <label for="recover-email">
                  <um-icon name="user" [size]="16"></um-icon>
                  Correo electrónico
                </label>
                <input
                  id="recover-email"
                  class="form-input"
                  type="email"
                  [(ngModel)]="recoverEmail"
                  name="recoverEmail"
                  placeholder="ejemplo＠correo.com"
                  autofocus
                  required
                />
              </div>

              @if (errorMsg) {
                <p class="error-msg">{{ errorMsg }}</p>
              }

              <button
                type="submit"
                class="login-btn"
                [disabled]="!recoverEmail.trim()"
              >
                Verificar correo
              </button>
            </form>

            <button class="forgot-link" (click)="view = 'login'; errorMsg = ''">
              ← Volver al inicio de sesión
            </button>
          </div>
        }

        <!-- ═══ RECOVER: STEP 2 — VERIFY IDENTITY ═══ -->
        @if (view === 'recover-verify') {
          <div class="login-card animate-fadeInUp">
            <div class="card-top-bar recover-bar"></div>
            <h2>🛡️ Verificar Identidad</h2>
            <p class="login-subtitle">
              Encontramos la cuenta de <strong>{{ foundUserHint }}</strong>.
              Escribe el nombre completo registrado para confirmar tu identidad.
            </p>

            <form class="login-form" (ngSubmit)="verifyIdentity()">
              <div class="form-group">
                <label for="verify-name">
                  <um-icon name="user" [size]="16"></um-icon>
                  Nombre completo
                </label>
                <input
                  id="verify-name"
                  class="form-input"
                  type="text"
                  [(ngModel)]="verifyName"
                  name="verifyName"
                  placeholder="Tu nombre como lo registraste"
                  autofocus
                  required
                />
              </div>

              @if (errorMsg) {
                <p class="error-msg">{{ errorMsg }}</p>
              }

              <button
                type="submit"
                class="login-btn"
                [disabled]="!verifyName.trim()"
              >
                Confirmar identidad
              </button>
            </form>

            <button class="forgot-link" (click)="view = 'recover-email'; errorMsg = ''">
              ← Cambiar correo
            </button>
          </div>
        }

        <!-- ═══ RECOVER: STEP 3 — NEW PASSWORD ═══ -->
        @if (view === 'recover-reset') {
          <div class="login-card animate-fadeInUp">
            <div class="card-top-bar success-bar"></div>
            <h2>🔐 Nueva Contraseña</h2>
            <p class="login-subtitle">Identidad confirmada. Establece tu nueva contraseña.</p>

            <form class="login-form" (ngSubmit)="resetPassword()">
              <div class="form-group">
                <label for="new-pass">
                  Nueva contraseña
                </label>
                <div class="password-wrap">
                  <input
                    id="new-pass"
                    class="form-input"
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="newPassword"
                    name="newPassword"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button type="button" class="toggle-pass" (click)="showPassword = !showPassword" tabindex="-1">
                    {{ showPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label for="confirm-pass">
                  Confirmar contraseña
                </label>
                <div class="password-wrap">
                  <input
                    id="confirm-pass"
                    class="form-input"
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="confirmNewPassword"
                    name="confirmNewPassword"
                    placeholder="Repite la contraseña"
                    required
                  />
                </div>
                @if (confirmNewPassword && newPassword !== confirmNewPassword) {
                  <span class="field-error">Las contraseñas no coinciden</span>
                }
              </div>

              @if (errorMsg) {
                <p class="error-msg">{{ errorMsg }}</p>
              }

              @if (successMsg) {
                <p class="success-msg">{{ successMsg }}</p>
              }

              <button
                type="submit"
                class="login-btn"
                [disabled]="newPassword.length < 6 || newPassword !== confirmNewPassword"
              >
                Guardar nueva contraseña
              </button>
            </form>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: 'login.scss',
})
export class LoginComponent implements AfterViewInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private dataSync = inject(DataSyncService);

  // DOM references — needed because Safari autocomplete can desync ngModel
  @ViewChild('usernameInput') usernameInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') passwordInputRef!: ElementRef<HTMLInputElement>;

  // View state
  view: 'login' | 'recover-email' | 'recover-verify' | 'recover-reset' = 'login';

  // Login
  username = '';
  password = '';
  showPassword = false;
  errorMsg = '';

  // Recovery
  recoverEmail = '';
  foundUserId = '';
  foundUserHint = '';
  verifyName = '';
  newPassword = '';
  confirmNewPassword = '';
  successMsg = '';

  ngAfterViewInit(): void {
    // Safari autocomplete fires before Angular bindings are ready.
    // Give it a moment to populate, then sync values from the DOM.
    setTimeout(() => {
      if (this.usernameInputRef?.nativeElement?.value && !this.username) {
        this.username = this.usernameInputRef.nativeElement.value;
      }
      if (this.passwordInputRef?.nativeElement?.value && !this.password) {
        this.password = this.passwordInputRef.nativeElement.value;
      }
    }, 300);
  }

  async login(): Promise<void> {
    // Safari autocomplete can fill fields without updating ngModel.
    // Read values directly from the DOM as a fallback.
    const rawUser = this.usernameInputRef?.nativeElement?.value ?? '';
    const rawPass = this.passwordInputRef?.nativeElement?.value ?? '';

    // Use whichever source has a value (ngModel or DOM)
    const finalUser = (this.username?.trim() || rawUser?.trim() || '');
    const finalPass = (this.password || rawPass || '');

    if (!finalUser || !finalPass) {
      this.errorMsg = 'Ingresa tu correo y contraseña';
      return;
    }

    let user = this.userService.authenticate(finalUser, finalPass);

    // Safari / new-browser fallback: if auth fails, the server data may not
    // have been restored yet. Force a sync and retry once.
    if (!user) {
      try {
        console.log('[Login] First attempt failed — syncing from server and retrying...');
        await this.dataSync.syncFromServer();
        this.userService.reinitialize();
        user = this.userService.authenticate(finalUser, finalPass);
      } catch (e) {
        console.warn('[Login] Server sync failed:', e);
      }
    }

    if (user) {
      this.router.navigate(['/d/dashboard']);
    } else {
      this.errorMsg = 'Correo o contraseña incorrectos';
    }
  }

  goToRecover(): void {
    this.view = 'recover-email';
    this.errorMsg = '';
    this.recoverEmail = this.username; // pre-fill if they already typed something
  }

  verifyEmail(): void {
    this.errorMsg = '';
    const users = this.userService.getAllUsers();
    const found = users.find(
      u => u.email?.toLowerCase() === this.recoverEmail.trim().toLowerCase()
    );

    if (!found) {
      this.errorMsg = 'No existe una cuenta con ese correo electrónico';
      return;
    }

    this.foundUserId = found.id;
    // Show hint: first name + masked last name
    const parts = found.name.split(' ');
    this.foundUserHint = parts[0] + (parts.length > 1 ? ' ' + parts[1][0] + '***' : '');
    this.view = 'recover-verify';
  }

  verifyIdentity(): void {
    this.errorMsg = '';
    const user = this.userService.getUserById(this.foundUserId);
    if (!user) return;

    if (this.verifyName.trim().toLowerCase() === user.name.toLowerCase()) {
      this.view = 'recover-reset';
      this.showPassword = false;
    } else {
      this.errorMsg = 'El nombre no coincide con la cuenta registrada';
    }
  }

  resetPassword(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (this.newPassword.length < 6) {
      this.errorMsg = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMsg = 'Las contraseñas no coinciden';
      return;
    }

    this.userService.updateUserPassword(this.foundUserId, this.newPassword);
    this.successMsg = '✅ Contraseña actualizada correctamente';

    // Auto-redirect to login after 2s
    setTimeout(() => {
      this.view = 'login';
      this.username = this.recoverEmail;
      this.password = '';
      this.successMsg = '';
      this.errorMsg = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
    }, 2000);
  }
}
