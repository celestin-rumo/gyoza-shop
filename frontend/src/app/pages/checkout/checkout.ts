import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../cart.service';
import { OrderCustomer, OrderService } from '../../order.service';
import {
  DsBottomNavComponent,
  DsButtonComponent,
  DsCartAddEvent,
  DsCartItemComponent,
  DsFooterComponent,
  DsNavbarComponent,
  DsNavLink,
  DsPricePipe,
  DsSectionHeaderComponent,
} from '../../design-system';

@Component({
  selector: 'app-checkout',
  imports: [
    DsNavbarComponent,
    DsSectionHeaderComponent,
    DsCartItemComponent,
    DsButtonComponent,
    DsBottomNavComponent,
    DsFooterComponent,
    DsPricePipe,
    FormField,
    FormRoot,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  protected readonly cart = inject(CartService);

  protected readonly navLinks: DsNavLink[] = [
    { label: 'Accueil', href: '/', icon: 'home' },
    { label: 'Nos gyozas', href: '/nos-gyozas', icon: 'gyozas' },
    { label: 'À propos', href: '/a-propos', icon: 'about' },
    { label: 'Contact', href: '/contact', icon: 'contact' },
  ];

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly orderPlaced = signal(false);

  protected readonly customer = signal<OrderCustomer>({
    firstName: '',
    lastName: '',
    address: '',
    email: '',
  });

  protected readonly checkoutForm = form(
    this.customer,
    (path) => {
      required(path.firstName, { message: 'Le prénom est requis.' });
      required(path.lastName, { message: 'Le nom est requis.' });
      required(path.address, { message: 'L’adresse est requise.' });
      required(path.email, { message: 'L’email est requis.' });
      email(path.email, { message: 'Veuillez saisir un email valide.' });
    },
    {
      submission: {
        action: async () => {
          this.submitError.set(null);
          this.submitting.set(true);

          try {
            await firstValueFrom(
              this.orderService.placeOrder(this.customer(), this.cart.lines(), this.cart.subtotal()),
            );
            this.cart.clear();
            this.orderPlaced.set(true);
          } catch {
            this.submitError.set(
              'Une erreur est survenue lors de l’envoi de la commande. Merci de réessayer.',
            );
          } finally {
            this.submitting.set(false);
          }

          return undefined;
        },
      },
    },
  );

  protected trackLine(_index: number, line: DsCartAddEvent): string {
    return `${line.product.id}:${line.pack.id}`;
  }

  protected onCartQuantityChange(line: DsCartAddEvent, quantity: number): void {
    this.cart.setQuantity(line.product.id, line.pack.id, quantity);
  }

  protected onCartLineRemove(line: DsCartAddEvent): void {
    this.cart.remove(line.product.id, line.pack.id);
  }

  protected goHome(): void {
    this.router.navigateByUrl('/');
  }
}
