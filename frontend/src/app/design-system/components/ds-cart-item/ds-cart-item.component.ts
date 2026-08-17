import { Component, computed, input, output } from '@angular/core';
import { DsCartAddEvent } from '../ds-product-card/ds-product-card.component';

/**
 * <ds-cart-item [line]="line" (quantityChange)="onQuantityChange($event)" (remove)="onRemove()"></ds-cart-item>
 *
 * Utilisé pour : chaque ligne du panier (titre, pack, quantité modifiable, prix unitaire et total).
 */
@Component({
  selector: 'ds-cart-item',
  templateUrl: './ds-cart-item.component.html',
  styleUrl: './ds-cart-item.component.scss',
})
export class DsCartItemComponent {
  line = input.required<DsCartAddEvent>();

  quantityChange = output<number>();
  remove = output<void>();

  protected readonly lineTotal = computed(() => this.line().pack.price * this.line().quantity);

  protected decrement(): void {
    if (this.line().quantity <= 1) {
      return;
    }
    this.quantityChange.emit(this.line().quantity - 1);
  }

  protected increment(): void {
    this.quantityChange.emit(this.line().quantity + 1);
  }

  protected onRemove(): void {
    this.remove.emit();
  }

  protected formatPrice(value: number, currency = '€'): string {
    return `${value.toFixed(2).replace('.', ',')} ${currency}`;
  }
}
