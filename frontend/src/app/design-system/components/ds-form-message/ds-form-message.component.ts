import { Component, input } from '@angular/core';

export type DsFormMessageVariant = 'error' | 'success';

/**
 * <ds-form-message variant="error">Identifiants invalides.</ds-form-message>
 * <ds-form-message variant="success">Ton compte a été créé !</ds-form-message>
 *
 * A single reusable banner for form submit feedback, in either state.
 */
@Component({
  selector: 'ds-form-message',
  templateUrl: './ds-form-message.component.html',
  styleUrl: './ds-form-message.component.scss',
})
export class DsFormMessageComponent {
  readonly variant = input<DsFormMessageVariant>('error');
}
