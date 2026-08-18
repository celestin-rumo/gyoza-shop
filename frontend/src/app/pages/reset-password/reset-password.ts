import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { form, FormRoot, minLength, required, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { DsAuthCardComponent } from '../../design-system/components/ds-auth-card/ds-auth-card.component';
import { DsButtonComponent } from '../../design-system/components/ds-button/ds-button.component';
import { DsFormFieldComponent } from '../../design-system/components/ds-form-field/ds-form-field.component';
import { DsFormMessageComponent } from '../../design-system/components/ds-form-message/ds-form-message.component';

interface ResetPasswordFields {
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-reset-password',
  imports: [
    DsAuthCardComponent,
    DsFormFieldComponent,
    DsFormMessageComponent,
    DsButtonComponent,
    FormRoot,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly fields = signal<ResetPasswordFields>({
    newPassword: '',
    confirmPassword: '',
  });

  protected readonly resetPasswordForm = form(
    this.fields,
    (path) => {
      required(path.newPassword, { message: 'Le mot de passe est requis.' });
      minLength(path.newPassword, 8, {
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
      });
      required(path.confirmPassword, { message: 'Merci de confirmer le mot de passe.' });
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() !== valueOf(path.newPassword)
          ? { kind: 'mismatch', message: 'Les mots de passe ne correspondent pas.' }
          : null,
      );
    },
    {
      submission: {
        action: async () => {
          this.submitError.set(null);
          this.submitting.set(true);

          try {
            await firstValueFrom(
              this.authService.resetPassword(this.token, this.fields().newPassword),
            );
            await this.router.navigateByUrl('/login');
          } catch {
            this.submitError.set('Ce lien est invalide ou a expiré.');
          } finally {
            this.submitting.set(false);
          }

          return undefined;
        },
      },
    },
  );
}
