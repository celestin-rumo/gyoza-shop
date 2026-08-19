import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { OrderCustomer, OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import {
  DsButtonComponent,
  DsCartAddEvent,
  DsCartItemComponent,
  DsPricePipe,
  DsSectionHeaderComponent,
} from '../../design-system';
import { DsFormMessageComponent } from '../../design-system/components/ds-form-message/ds-form-message.component';

@Component({
  selector: 'app-checkout',
  imports: [
    DsSectionHeaderComponent,
    DsCartItemComponent,
    DsButtonComponent,
    DsFormMessageComponent,
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
  private readonly authService = inject(AuthService);
  protected readonly cart = inject(CartService);

  protected readonly currentUser = this.authService.currentUser;

  protected readonly orderPlaced = signal(false);
  protected readonly placedWithName = signal('');
  protected readonly placedWithEmail = signal('');

  protected readonly accountSubmitting = signal(false);
  protected readonly accountSubmitError = signal<string | null>(null);

  protected readonly guestSubmitting = signal(false);
  protected readonly guestSubmitError = signal<string | null>(null);

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
          this.guestSubmitError.set(null);
          this.guestSubmitting.set(true);

          try {
            await this.submitOrder(this.customer());
          } catch {
            this.guestSubmitError.set(
              'Une erreur est survenue lors de l’envoi de la commande. Merci de réessayer.',
            );
          } finally {
            this.guestSubmitting.set(false);
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

  protected goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
  }

  protected async reserveWithAccount(): Promise<void> {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    this.accountSubmitError.set(null);
    this.accountSubmitting.set(true);

    try {
      await this.submitOrder({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: `${user.street}, ${user.postalCode} ${user.city}`,
      });
    } catch {
      this.accountSubmitError.set(
        'Une erreur est survenue lors de l’envoi de la commande. Merci de réessayer.',
      );
    } finally {
      this.accountSubmitting.set(false);
    }
  }

  private async submitOrder(customer: OrderCustomer): Promise<void> {
    await firstValueFrom(this.orderService.placeOrder(customer, this.cart.lines()));
    this.placedWithName.set(customer.firstName);
    this.placedWithEmail.set(customer.email);
    this.cart.clear();
    this.orderPlaced.set(true);
  }
}
