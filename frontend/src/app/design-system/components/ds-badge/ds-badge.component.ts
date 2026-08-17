import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsBadgeShape = 'pill' | 'stamp';
export type DsBadgeTone = 'accent' | 'sage' | 'neutral';

/**
 * <ds-badge shape="stamp" tone="accent">
 *   <span>FAIT MAISON</span>
 *   <small>AVEC AMOUR</small>
 * </ds-badge>
 *
 * <ds-badge shape="pill" tone="sage">Nouveau</ds-badge>
 *
 * Utilisé pour : le sceau "Fait maison avec amour" sur le hero,
 * ou tout petit label/tag décoratif.
 */
@Component({
  selector: 'ds-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ds-badge.component.html',
  styleUrls: ['./ds-badge.component.scss'],
})
export class DsBadgeComponent {
  @Input() shape: DsBadgeShape = 'pill';
  @Input() tone: DsBadgeTone = 'accent';
}
