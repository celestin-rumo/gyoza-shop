import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * <ds-feature-item title="Ingrédients frais" subtitle="et sélectionnés">
 *   <svg dsIcon>...</svg>
 * </ds-feature-item>
 *
 * Utilisé pour : la ligne de 3 icônes sous le hero
 * (Ingrédients frais / Fait maison / Livraison rapide),
 * réutilisable aussi dans une page "À propos" ou un footer.
 */
@Component({
  selector: 'ds-feature-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ds-feature-item.component.html',
  styleUrls: ['./ds-feature-item.component.scss'],
})
export class DsFeatureItemComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
