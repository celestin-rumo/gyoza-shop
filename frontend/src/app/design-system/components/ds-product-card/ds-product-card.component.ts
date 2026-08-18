import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DsPackPickerComponent, DsPackSelection, DsProductPack } from '../ds-pack-picker/ds-pack-picker.component';
import { DsPricePipe } from '../../pipes/ds-price.pipe';

export type DsProductTagTone = 'accent' | 'neutral' | 'sage';

export interface DsProduct {
  id: number;
  tagTone: DsProductTagTone;
  imageUrl: string;
  imageAlt: string;
  name: string;
  description: string;
  packs: DsProductPack[];
}

export interface DsCartAddEvent {
  product: DsProduct;
  pack: DsProductPack;
  quantity: number;
}

export interface DsCartRemoveEvent {
  product: DsProduct;
  pack: DsProductPack;
}

/**
 * <ds-product-card [product]="gyozaPoulet" (add)="onAdd($event)"></ds-product-card>
 *
 * Used for: the cards in the "Our gyozas" grid, with a choice of pack (6/10/20) and quantity
 * before adding to cart.
 */
@Component({
  selector: 'ds-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DsPackPickerComponent, DsPricePipe],
  templateUrl: './ds-product-card.component.html',
  styleUrls: ['./ds-product-card.component.scss'],
})
export class DsProductCardComponent {
  @Input({ required: true }) product!: DsProduct;
  /** Quantity already in the cart for this product, by pack id. */
  @Input() packQuantitiesInCart: Record<string, number> = {};

  @Output() add = new EventEmitter<DsCartAddEvent>();
  @Output() remove = new EventEmitter<DsCartRemoveEvent>();

  onPackAdd(selection: DsPackSelection): void {
    this.add.emit({ product: this.product, pack: selection.pack, quantity: selection.quantity });
  }

  onPackRemove(pack: DsProductPack): void {
    this.remove.emit({ product: this.product, pack });
  }

  get fromPrice(): number {
    return Math.min(...this.product.packs.map((pack) => pack.price));
  }
}
