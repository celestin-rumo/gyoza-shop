import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconButtonComponent, DsIconButtonVariant } from '../ds-icon-button/ds-icon-button.component';

export type DsProductTagTone = 'accent' | 'neutral' | 'sage';

export interface DsProduct {
  id: string;
  tagTone: DsProductTagTone;
  imageUrl: string;
  imageAlt: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
}

/**
 * <ds-product-card [product]="gyozaPoulet" (add)="onAdd($event)"></ds-product-card>
 *
 * Utilisé pour : les 4 cartes de la grille "Nos gyozas",
 * réutilisable sur la page "Nos gyozas" complète, les suggestions, etc.
 */
@Component({
  selector: 'ds-product-card',
  standalone: true,
  imports: [CommonModule, DsIconButtonComponent],
  templateUrl: './ds-product-card.component.html',
  styleUrls: ['./ds-product-card.component.scss'],
})
export class DsProductCardComponent {
  @Input({ required: true }) product!: DsProduct;

  @Output() add = new EventEmitter<DsProduct>();

  onAdd(): void {
    this.add.emit(this.product);
  }

  get addButtonVariant(): DsIconButtonVariant {
    return this.product.tagTone === 'accent' ? 'accent' : 'sage';
  }

  formatPrice(value: number, currency = '€'): string {
    return `${value.toFixed(2).replace('.', ',')} ${currency}`;
  }
}
