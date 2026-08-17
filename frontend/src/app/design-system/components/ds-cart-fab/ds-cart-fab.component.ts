import { Component, input, output } from '@angular/core';

/**
 * <ds-cart-fab [count]="cart.count()" (pressed)="cartOpen.set(true)"></ds-cart-fab>
 *
 * Utilisé pour : le bouton panier flottant affiché sur mobile (sous 640px), en remplacement
 * du bouton "Panier" du header qui n'a plus la place. Toujours au-dessus de ds-bottom-nav.
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
