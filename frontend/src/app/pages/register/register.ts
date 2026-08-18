import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { email, form, FormRoot, minLength, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { DsAuthCardComponent } from '../../design-system/components/ds-auth-card/ds-auth-card.component';
import { DsButtonComponent } from '../../design-system/components/ds-button/ds-button.component';
import { DsFormFieldComponent } from '../../design-system/components/ds-form-field/ds-form-field.component';
import { DsFormMessageComponent } from '../../design-system/components/ds-form-message/ds-form-message.component';

interface RegisterFields {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-register',
  imports: [
    DsAuthCardComponent,
    DsFormFieldComponent,
    DsFormMessageComponent,
    DsButtonComponent,
    FormRoot,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly authService = inject(AuthService);

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly registered = signal(false);

  protected readonly fields = signal<RegisterFields>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  protected readonly registerForm = form(
    this.fields,
    (path) => {
      required(path.firstName, { message: 'Le prénom est requis.' });
      required(path.lastName, { message: 'Le nom est requis.' });
      required(path.email, { message: 'L’email est requis.' });
      email(path.email, { message: 'Veuillez saisir un email valide.' });
      required(path.password, { message: 'Le mot de passe est requis.' });
      minLength(path.password, 8, {
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
      });
    },
    {
      submission: {
        action: async () => {
          this.submitError.set(null);
          this.submitting.set(true);

          try {
            await firstValueFrom(this.authService.register(this.fields()));
            this.registered.set(true);
          } catch (error: unknown) {
            const code =
              error instanceof HttpErrorResponse
                ? (error.error as { code?: string })?.code
                : undefined;

            this.submitError.set(
              code === 'EMAIL_ALREADY_REGISTERED'
                ? 'Cette adresse email est déjà utilisée.'
                : 'Une erreur est survenue, réessaie plus tard.',
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
