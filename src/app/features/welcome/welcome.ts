import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { UmIconComponent } from '../../shared/components/um-icon/um-icon';

@Component({
  selector: 'um-welcome',
  standalone: true,
  imports: [FormsModule, UmIconComponent],
  template: `
    <div class="welcome-page">
      <div class="welcome-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        <div class="bg-orb orb-3"></div>
      </div>

      <div class="welcome-container">
        <div class="welcome-card animate-fadeInUp">
          <div class="card-top-bar"></div>

          <!-- Header: Text Logo + Tagline -->
          <div class="card-header-col">
            <img src="assets/images/brand/logo-color-vertical.png" alt="PsicoRuta" class="welcome-brand-logo" />
            <p class="tagline">Configura tu perfil para comenzar</p>
          </div>

          <form class="welcome-form" (ngSubmit)="register()">
            <!-- Row 1: Name + Occupation -->
            <div class="form-row">
              <div class="form-group">
                <label for="reg-name">Nombre completo *</label>
                <input id="reg-name" class="form-input" type="text"
                  [(ngModel)]="name" name="name"
                  placeholder="Tu nombre" autofocus required />
              </div>
              <div class="form-group">
                <label for="reg-occupation">Ocupación</label>
                <input id="reg-occupation" class="form-input" type="text"
                  [(ngModel)]="occupation" name="occupation"
                  placeholder="Ej: Emprendedor" />
              </div>
            </div>

            <!-- Row 2: Age + Company Size -->
            <div class="form-row">
              <div class="form-group">
                <label for="reg-age">Edad</label>
                <input id="reg-age" class="form-input" type="number"
                  [(ngModel)]="age" name="age"
                  placeholder="30" min="16" max="99" />
              </div>
              <div class="form-group">
                <label for="reg-company">Tamaño de empresa</label>
                <select id="reg-company" class="form-input"
                  [(ngModel)]="companySize" name="companySize">
                  <option value="">Seleccionar...</option>
                  <option value="solo">Solo yo</option>
                  <option value="micro">2-10 personas</option>
                  <option value="small">11-50 personas</option>
                  <option value="medium">51-200 personas</option>
                  <option value="large">200+ personas</option>
                </select>
              </div>
            </div>

            <!-- Row 3: Email + Company -->
            <div class="form-row">
              <div class="form-group">
                <label for="reg-email">Correo electrónico *</label>
                <input id="reg-email" class="form-input" type="email"
                  [(ngModel)]="email" name="email"
                  placeholder="tu@email.com" required />
              </div>
              <div class="form-group">
                <label for="reg-company">Empresa / Organización</label>
                <input id="reg-company" class="form-input" type="text"
                  [(ngModel)]="companyName" name="companyName"
                  placeholder="Ej: Mi Empresa S.A.S" />
              </div>
            </div>

            <!-- Row 4: Password + Confirm -->
            <div class="form-row">
              <div class="form-group">
                <label for="reg-password">Clave *</label>
                <div class="password-wrap">
                  <input id="reg-password" class="form-input" [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="password" name="password"
                    placeholder="Mín. 6 caracteres" required minlength="6" />
                  <button type="button" class="pw-toggle" (click)="showPassword = !showPassword" tabindex="-1">
                    {{ showPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label for="reg-confirm">Confirmar clave *</label>
                <input id="reg-confirm" class="form-input" [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="confirmPassword" name="confirmPassword"
                  placeholder="Repite tu clave" required />
                @if (confirmPassword && password !== confirmPassword) {
                  <span class="field-error">Las claves no coinciden</span>
                }
              </div>
            </div>

            <button type="submit" class="register-btn"
              [disabled]="!name.trim() || !email.trim() || password.length < 6 || password !== confirmPassword">
              Comenzar mi camino
              <um-icon name="bolt" [size]="18"></um-icon>
            </button>
          </form>

          <p class="card-footer">
            Gestión clínica inteligente · PsicoRuta
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrl: 'welcome.scss',
})
export class WelcomeComponent {
  private router = inject(Router);
  private userService = inject(UserService);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  occupation = '';
  companyName = '';
  age: number | null = null;
  companySize = '';

  register(): void {
    if (this.name.trim() && this.email.trim() && this.password.length >= 6) {
      this.userService.saveProfile({
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
        occupation: this.occupation.trim() || undefined,
        companyName: this.companyName.trim() || undefined,
        age: this.age || undefined,
        companySize: this.companySize || undefined,
      });
      this.router.navigate(['/setup']);
    }
  }
}
