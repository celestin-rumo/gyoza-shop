import { Component, input } from '@angular/core';

import { DsSectionHeaderComponent } from '../ds-section-header/ds-section-header.component';

/**
 * <ds-auth-card title="Se connecter" subtitle="Accède à ton compte.">
 *   <form>...</form>
 * </ds-auth-card>
 *
 * Shared centered layout for every single-form auth page (login, register,
 * forgot-password, reset-password, verify-email).
 */
@Component({
  selector: 'ds-auth-card',
  imports: [DsSectionHeaderComponent],
  templateUrl: './ds-auth-card.component.html',
  styleUrl: './ds-auth-card.component.scss',
})
export class DsAuthCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
