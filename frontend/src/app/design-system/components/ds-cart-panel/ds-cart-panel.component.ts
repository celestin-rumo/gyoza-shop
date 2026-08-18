import { Component, computed, input, output } from '@angular/core';
import { DsCartAddEvent } from '../ds-product-card/ds-product-card.component';
import { DsCartItemComponent } from '../ds-cart-item/ds-cart-item.component';
import { DsButtonComponent } from '../ds-button/ds-button.component';
import { DsPricePipe } from '../../pipes/ds-price.pipe';

export interface DsCartQuantityChangeEvent {
  line: DsCartAddEvent;
  quantity: number;
}

/**
 * <ds-cart-panel
 *   [lines]="cart.lines()"
 *   [open]="cartOpen()"
 *   (quantityChange)="onQuantityChange($event)"
 *   (remove)="onRemove($event)"
 *   (confirm)="onConfirmOrder()"
 *   (closed)="cartOpen.set(false)"
 * ></ds-cart-panel>
 *
 * Used for: the panel that opens from the header's "Cart" button, listing each
 * item (product, pack, quantity), the subtotal, and the order confirmation button.
 */
@Component({
  selector: 'ds-cart-panel',
  imports: [DsCartItemComponent, DsButtonComponent, DsPricePipe],
  templateUrl: './ds-cart-panel.component.html',
  styleUrl: './ds-cart-panel.component.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class DsCartPanelComponent {
  lines = input<DsCartAddEvent[]>([]);
  open = input(false);

  quantityChange = output<DsCartQuantityChangeEvent>();
  remove = output<DsCartAddEvent>();
  confirm = output<void>();
  closed = output<void>();

  protected readonly subtotal = computed(() =>
    this.lines().reduce((total, line) => total + line.pack.price * line.quantity, 0),
  );

  protected trackLine(_index: number, line: DsCartAddEvent): string {
    return `${line.product.id}:${line.pack.id}`;
  }

  protected onQuantityChange(line: DsCartAddEvent, quantity: number): void {
    this.quantityChange.emit({ line, quantity });
  }

  protected onRemove(line: DsCartAddEvent): void {
    this.remove.emit(line);
  }

  protected onConfirm(): void {
    this.confirm.emit();
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }
}
