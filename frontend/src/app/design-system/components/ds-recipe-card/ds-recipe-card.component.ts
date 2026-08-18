import { Component, computed, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { DsPackPickerComponent, DsPackSelection, DsProductPack } from '../ds-pack-picker/ds-pack-picker.component';
import { DsCartAddEvent, DsCartRemoveEvent, DsProduct } from '../ds-product-card/ds-product-card.component';
import { DsPricePipe } from '../../pipes/ds-price.pipe';

export type DsRecipeImagePosition = 'left' | 'right';

export interface DsRecipeIngredient {
  label: string;
  /** Local origin to highlight (e.g. "Ferme d'Arrenay, Ependes"). Omitted for a minor ingredient. */
  origin?: string;
}

/**
 * <ds-recipe-card
 *   [product]="gyozaPoulet"
 *   [ingredients]="pouletIngredients"
 *   imagePosition="left"
 *   (add)="onAdd($event)"
 * ></ds-recipe-card>
 *
 * Used for: the recipe card (ingredients in order of importance, for informational purposes)
 * on the "Our gyozas" page. Ingredients with an `origin` are highlighted.
 */
@Component({
  selector: 'ds-recipe-card',
  imports: [NgOptimizedImage, DsPackPickerComponent, DsPricePipe],
  templateUrl: './ds-recipe-card.component.html',
  styleUrl: './ds-recipe-card.component.scss',
})
export class DsRecipeCardComponent {
  product = input.required<DsProduct>();
  ingredients = input<DsRecipeIngredient[]>([]);
  imagePosition = input<DsRecipeImagePosition>('left');
  /** Quantity already in the cart for this product, by pack id. */
  packQuantitiesInCart = input<Record<string, number>>({});

  add = output<DsCartAddEvent>();
  remove = output<DsCartRemoveEvent>();

  protected readonly featuredIngredients = computed(() => this.ingredients().filter((i) => i.origin));
  protected readonly otherIngredients = computed(() => this.ingredients().filter((i) => !i.origin));

  protected readonly fromPrice = computed(() => Math.min(...this.product().packs.map((pack) => pack.price)));

  protected onPackAdd(selection: DsPackSelection): void {
    this.add.emit({ product: this.product(), pack: selection.pack, quantity: selection.quantity });
  }

  protected onPackRemove(pack: DsProductPack): void {
    this.remove.emit({ product: this.product(), pack });
  }
}
