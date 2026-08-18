import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * <ds-feature-item title="Fresh ingredients" subtitle="carefully selected">
 *   <svg dsIcon>...</svg>
 * </ds-feature-item>
 *
 * Used for: the row of 3 icons under the hero
 * (Fresh ingredients / Handmade / Fast delivery),
 * also reusable on an "About" page or in a footer.
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
