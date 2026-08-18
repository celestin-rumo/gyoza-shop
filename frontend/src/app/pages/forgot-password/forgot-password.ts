import { Component, inject, signal } from '@angular/core';
import { email, form, FormRoot, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { DsAuthCardComponent } from '../../design-system/components/ds-auth-card/ds-auth-card.component';
import { DsButtonComponent } from '../../design-system/components/ds-button/ds-button.component';
import { DsFormFieldComponent } from '../../design-system/components/ds-form-field/ds-form-field.component';
import { DsFormMessageComponent } from '../../design-system/components/ds-form-message/ds-form-message.component';

interface ForgotPasswordFields {
  email: string;
}

@Component({
  selector: 'app-forgot-password',
  imports: [
    DsAuthCardComponent,
    DsFormFieldComponent,
    DsFormMessageComponent,
    DsButtonComponent,
    FormRoot,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);

  protected readonly fields = signal<ForgotPasswordFields>({ email: '' });

  protected readonly forgotPasswordForm = form(
    this.fields,
    (path) => {
      required(path.email, { message: 'L’email est requis.' });
      email(path.email, { message: 'Veuillez saisir un email valide.' });
    },
    {
      submission: {
        action: async () => {
          this.submitting.set(true);

          try {
            await firstValueFrom(this.authService.forgotPassword(this.fields().email));
          } finally {
            this.submitting.set(false);
            // Always show the same message whether or not the email exists,
            // to avoid leaking which addresses have an account.
            this.submitted.set(true);
          }

          return undefined;
        },
      },
    },
  );
}
