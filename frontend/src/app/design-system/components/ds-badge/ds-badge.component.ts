import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsBadgeShape = 'pill' | 'stamp';
export type DsBadgeTone = 'accent' | 'sage' | 'neutral';

/**
 * <ds-badge shape="stamp" tone="accent">
 *   <span>HANDMADE</span>
 *   <small>WITH LOVE</small>
 * </ds-badge>
 *
 * <ds-badge shape="pill" tone="sage">New</ds-badge>
 *
 * Used for: the "Handmade with love" stamp on the hero,
 * or any small decorative label/tag.
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
