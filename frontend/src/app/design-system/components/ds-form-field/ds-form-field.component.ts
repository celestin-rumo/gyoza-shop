import { Component, computed, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

export type DsFormFieldType = 'text' | 'email' | 'password';

/**
 * <ds-form-field label="Email" fieldId="email" type="email" autocomplete="email" [field]="loginForm.email"></ds-form-field>
 *
 * Label + native input + validation error, wired to a Signal Forms field.
 * Used for every text/email/password field across the auth pages so the
 * input styling and error-display logic live in one place.
 */
@Component({
  selector: 'ds-form-field',
  imports: [FormField],
  templateUrl: './ds-form-field.component.html',
  styleUrl: './ds-form-field.component.scss',
})
export class DsFormFieldComponent {
  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly type = input<DsFormFieldType>('text');
  readonly autocomplete = input<string>('off');
  readonly field = input.required<Field<string>>();

  protected readonly state = computed(() => this.field()());
}
