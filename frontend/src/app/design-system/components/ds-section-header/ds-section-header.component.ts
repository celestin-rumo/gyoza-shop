import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsSectionAlign = 'center' | 'left';

/**
 * <ds-section-header title="Our gyozas" subtitle="Unique flavors for every taste."></ds-section-header>
 *
 * Used for: any section title (Our gyozas, FAQ, About, Contact...).
 */
@Component({
  selector: 'ds-section-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ds-section-header.component.html',
  styleUrls: ['./ds-section-header.component.scss'],
})
export class DsSectionHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() align: DsSectionAlign = 'center';
}
