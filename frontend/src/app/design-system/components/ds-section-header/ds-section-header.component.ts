import { Component, Input } from '@angular/core';

export type DsSectionAlign = 'center' | 'left';

/**
 * <ds-section-header title="Our gyozas" subtitle="Unique flavors for every taste."></ds-section-header>
 *
 * Used for: any section title (Our gyozas, FAQ, About, Contact...).
 */
@Component({
  selector: 'ds-section-header',
  standalone: true,
  templateUrl: './ds-section-header.component.html',
  styleUrls: ['./ds-section-header.component.scss'],
})
export class DsSectionHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() align: DsSectionAlign = 'center';
  /** Use 1 when this is the page's only/main heading (AXE requires exactly one h1 per page). */
  @Input() level: 1 | 2 = 2;
}
