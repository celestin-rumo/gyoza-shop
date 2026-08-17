import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DsPackPickerComponent, DsPackSelection, DsProductPack } from '../ds-pack-picker/ds-pack-picker.component';

export type DsProductTagTone = 'accent' | 'neutral' | 'sage';

export interface DsProduct {
  id: string;
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
 * Utilisé pour : les cartes de la grille "Nos gyozas", avec choix du pack (6/10/20) et de la quantité
 * avant ajout au panier.
 */
@Component({
  selector: 'ds-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DsPackPickerComponent],
  templateUrl: './ds-product-card.component.html',
  styleUrls: ['./ds-product-card.component.scss'],
})
export class DsProductCardComponent {
  @Input({ required: true }) product!: DsProduct;
  /** Quantité déjà présente dans le panier pour ce produit, par id de pack. */
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

  formatPrice(value: number, currency = '€'): string {
    return `${value.toFixed(2).replace('.', ',')} ${currency}`;
  }
}
