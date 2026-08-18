import { Component, input, output } from '@angular/core';

/**
 * <ds-cart-fab [count]="cart.count()" (pressed)="cartOpen.set(true)"></ds-cart-fab>
 *
 * Used for: the floating cart button shown on mobile (below 640px), replacing the
 * header's "Cart" button which no longer fits. Always displayed above ds-bottom-nav.
 */
@Component({
  selector: 'ds-cart-fab',
  templateUrl: './ds-cart-fab.component.html',
  styleUrl: './ds-cart-fab.component.scss',
})
export class DsCartFabComponent {
  count = input(0);
  pressed = output<void>();
}
