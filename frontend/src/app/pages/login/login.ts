import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { email, form, FormRoot, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { apiErrorCode } from '../../shared/api-error';
import { DsAuthCardComponent } from '../../design-system/components/ds-auth-card/ds-auth-card.component';
import { DsButtonComponent } from '../../design-system/components/ds-button/ds-button.component';
import { DsFormFieldComponent } from '../../design-system/components/ds-form-field/ds-form-field.component';
import { DsFormMessageComponent } from '../../design-system/components/ds-form-message/ds-form-message.component';

interface Credentials {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [
    DsAuthCardComponent,
    DsFormFieldComponent,
    DsFormMessageComponent,
    DsButtonComponent,
    FormRoot,
    RouterLink,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly submitting = signal(false);
  protected readonly loginError = signal<string | null>(null);

  protected readonly credentials = signal<Credentials>({ email: '', password: '' });

  protected readonly loginForm = form(
    this.credentials,
    (path) => {
      required(path.email, { message: 'L’email est requis.' });
      email(path.email, { message: 'Veuillez saisir un email valide.' });
      required(path.password, { message: 'Le mot de passe est requis.' });
    },
    {
      submission: {
        action: async () => {
          this.loginError.set(null);
          this.submitting.set(true);

          try {
            const user = await firstValueFrom(
              this.authService.login(this.credentials().email, this.credentials().password),
            );

            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            await this.router.navigateByUrl(returnUrl ?? (user.role === 'ADMIN' ? '/admin' : '/'));
          } catch (error: unknown) {
            const code = apiErrorCode(error);

            this.loginError.set(
              code === 'ACCOUNT_NOT_VERIFIED'
                ? 'Ce compte n’a pas encore été vérifié. Vérifie tes emails pour l’activer.'
                : code === 'CSRF_INVALID'
                  ? 'Ta session a expiré, recharge la page et réessaie.'
                  : 'Identifiants invalides.',
            );
          } finally {
            this.submitting.set(false);
          }

          return undefined;
        },
      },
    },
  );
}
