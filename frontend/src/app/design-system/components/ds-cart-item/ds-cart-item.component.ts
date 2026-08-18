import { Component, computed, input, output } from '@angular/core';
import { DsCartAddEvent } from '../ds-product-card/ds-product-card.component';
import { DsPricePipe } from '../../pipes/ds-price.pipe';

/**
 * <ds-cart-item [line]="line" (quantityChange)="onQuantityChange($event)" (remove)="onRemove()"></ds-cart-item>
 *
 * Used for: each cart line (title, pack, editable quantity, unit price and total).
 */
@Component({
  selector: 'ds-cart-item',
  imports: [DsPricePipe],
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
}
