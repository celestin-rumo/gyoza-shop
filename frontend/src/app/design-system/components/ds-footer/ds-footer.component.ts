import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * <ds-footer></ds-footer>
 *
 * Used for: the footer, identical across every page of the site.
 */
@Component({
  selector: 'ds-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ds-footer.component.html',
  styleUrls: ['./ds-footer.component.scss'],
})
export class DsFooterComponent {
  @Input() brand = 'GYOZA';
  @Input() brandSuffix = 'MAISON';
  @Input() address = 'Chemin de la Pudressa 35, 1731 Ependes';
  @Input() email = 'admin@celestinrumo.ch';
  @Input() phone = '+41 76 433 28 94';

  get telHref(): string {
    return `tel:${this.phone.replace(/\s/g, '')}`;
  }

  get mailHref(): string {
    return `mailto:${this.email}`;
  }

  protected readonly currentYear = new Date().getFullYear();
}
