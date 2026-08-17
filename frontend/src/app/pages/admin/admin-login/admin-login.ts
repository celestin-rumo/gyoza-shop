import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';

import { AuthService } from '../../../services/auth.service';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';

interface Credentials {
  username: string;
  password: string;
}

@Component({
  selector: 'app-admin-login',
  imports: [DsSectionHeaderComponent, DsButtonComponent, FormField, FormRoot],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
})
export class AdminLogin {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly submitting = signal(false);
  protected readonly loginError = signal<string | null>(null);

  protected readonly credentials = signal<Credentials>({ username: '', password: '' });

  protected readonly loginForm = form(
    this.credentials,
    (path) => {
      required(path.username, { message: 'Le nom d’utilisateur est requis.' });
      required(path.password, { message: 'Le mot de passe est requis.' });
    },
    {
      submission: {
        action: async () => {
          this.loginError.set(null);
          this.submitting.set(true);

          try {
            await firstValueFrom(
              this.authService.login(this.credentials().username, this.credentials().password),
            );
            this.router.navigateByUrl('/admin');
          } catch {
            this.loginError.set('Identifiants invalides.');
          } finally {
            this.submitting.set(false);
          }

          return undefined;
        },
      },
    },
  );
}
