import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsSectionAlign = 'center' | 'left';

/**
 * <ds-section-header title="Nos gyozas" subtitle="Des saveurs uniques pour tous les goûts."></ds-section-header>
 *
 * Utilisé pour : tout titre de section (Nos gyozas, FAQ, À propos, Contact...).
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
