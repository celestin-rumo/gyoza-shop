import { Component, input } from '@angular/core';

/**
 * <ds-origin-card
 *   title="Farine"
 *   description="Cultivée et moulue par un paysan d'Ependes"
 *   href="https://..."
 * >
 *   <svg>...</svg>
 * </ds-origin-card>
 *
 * Utilisé pour : mettre en avant la provenance locale d'un ingrédient (farine, poulet, légumes...),
 * en carte cliquable vers le site du fournisseur.
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
