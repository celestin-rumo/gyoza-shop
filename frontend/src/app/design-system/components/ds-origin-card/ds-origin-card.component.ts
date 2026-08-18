import { Component, input } from '@angular/core';

/**
 * <ds-origin-card
 *   title="Flour"
 *   description="Grown and milled by a farmer in Ependes"
 *   href="https://..."
 * >
 *   <svg>...</svg>
 * </ds-origin-card>
 *
 * Used for: highlighting the local origin of an ingredient (flour, chicken, vegetables...),
 * as a clickable card linking to the supplier's website.
 */
@Component({
  selector: 'ds-origin-card',
  templateUrl: './ds-origin-card.component.html',
  styleUrl: './ds-origin-card.component.scss',
})
export class DsOriginCardComponent {
  title = input.required<string>();
  description = input.required<string>();
  href = input.required<string>();
  ctaLabel = input('Explorer le site du fournisseur');
}
