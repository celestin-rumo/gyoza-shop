import { Component, ElementRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { email, form, FormField, FormRoot, hidden, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { FreshAvailabilityService } from '../../services/fresh-availability.service';
import { FreshAvailability } from '../../models/fresh-availability.model';
import {
  ContentType,
  DELIVERY_SLOTS,
  FulfillmentMethod,
  PICKUP_SLOTS,
  SlotOption,
} from '../../models/fulfillment.model';
import {
  DsButtonComponent,
  DsCartAddEvent,
  DsCartItemComponent,
  DsPricePipe,
  DsSectionHeaderComponent,
  DsStep,
  DsStepperComponent,
} from '../../design-system';

interface CheckoutFormModel {
  fulfillmentMethod: FulfillmentMethod | null;
  slot: string;
  contentType: ContentType | null;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
}

const CART_STEP = 0;
const FULFILLMENT_STEP = 1;
const DETAILS_STEP = 2;
const PAYMENT_STEP = 3;

const STEPS: DsStep[] = [
  { id: 'panier', label: 'Panier' },
  { id: 'recuperation', label: 'Récupération' },
  { id: 'coordonnees', label: 'Coordonnées' },
  { id: 'paiement', label: 'Paiement' },
];

@Component({
  selector: 'app-checkout',
  imports: [
    DsSectionHeaderComponent,
    DsCartItemComponent,
    DsButtonComponent,
    DsPricePipe,
    DsStepperComponent,
    FormField,
    FormRoot,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly freshAvailabilityService = inject(FreshAvailabilityService);
  protected readonly cart = inject(CartService);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly steps = STEPS;

  protected readonly currentStepIndex = signal(CART_STEP);

  protected readonly orderPlaced = signal(false);
  protected readonly placedWithName = signal('');
  protected readonly placedWithEmail = signal('');

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly freshAvailability = signal<FreshAvailability | null>(null);
  protected readonly freshDisabled = computed(() => !this.freshAvailability()?.orderWindowOpen);

  private readonly stepHeading = viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');

  protected readonly checkoutModel = signal<CheckoutFormModel>({
    fulfillmentMethod: null,
    slot: '',
    contentType: null,
    firstName: '',
    lastName: '',
    email: '',
    address: '',
  });

  protected readonly checkoutForm = form(this.checkoutModel, (path) => {
    required(path.fulfillmentMethod, { message: 'Choisissez un mode de récupération.' });
    required(path.slot, { message: 'Choisissez un créneau.' });
    required(path.contentType, { message: 'Choisissez frais ou surgelé.' });

    required(path.firstName, { message: 'Le prénom est requis.' });
    required(path.lastName, { message: 'Le nom est requis.' });
    required(path.email, { message: 'L’email est requis.' });
    email(path.email, { message: 'Veuillez saisir un email valide.' });

    required(path.address, {
      message: 'L’adresse est requise pour une livraison.',
      when: ({ valueOf }) => valueOf(path.fulfillmentMethod) === 'DELIVERY',
    });
    hidden(path.address, {
      when: ({ valueOf }) => valueOf(path.fulfillmentMethod) !== 'DELIVERY',
    });
  });

  protected readonly slotOptions = computed<SlotOption[]>(() => {
    const method = this.checkoutModel().fulfillmentMethod;
    if (!method) {
      return [];
    }
    return method === 'PICKUP' ? PICKUP_SLOTS : DELIVERY_SLOTS;
  });

  protected readonly canAdvance = computed(() => {
    switch (this.currentStepIndex()) {
      case FULFILLMENT_STEP:
        return (
          this.checkoutForm.fulfillmentMethod().valid() &&
          this.checkoutForm.slot().valid() &&
          this.checkoutForm.contentType().valid()
        );
      case DETAILS_STEP:
        return (
          this.checkoutForm.firstName().valid() &&
          this.checkoutForm.lastName().valid() &&
          this.checkoutForm.email().valid() &&
          this.checkoutForm.address().valid() &&
          !this.submitting()
        );
      default:
        return true;
    }
  });

  constructor() {
    effect(() => {
      this.currentStepIndex();
      queueMicrotask(() => this.stepHeading()?.nativeElement.focus());
    });
  }

  ngOnInit(): void {
    this.loadFreshAvailability();
  }

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

  protected selectFulfillmentMethod(method: FulfillmentMethod): void {
    this.checkoutModel.update((model) => ({ ...model, fulfillmentMethod: method, slot: '' }));
    this.checkoutForm.fulfillmentMethod().markAsTouched();
  }

  protected selectSlot(slot: string): void {
    this.checkoutModel.update((model) => ({ ...model, slot }));
    this.checkoutForm.slot().markAsTouched();
  }

  protected selectContentType(contentType: ContentType): void {
    if (contentType === 'FRESH' && this.freshDisabled()) {
      return;
    }
    this.checkoutModel.update((model) => ({ ...model, contentType }));
    this.checkoutForm.contentType().markAsTouched();
  }

  protected prefillFromAccount(): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.checkoutModel.update((model) => ({
      ...model,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: model.fulfillmentMethod === 'DELIVERY' ? `${user.street}, ${user.postalCode} ${user.city}` : model.address,
    }));
  }

  protected onStepperBack(): void {
    this.currentStepIndex.update((index) => Math.max(CART_STEP, index - 1));
  }

  protected async onStepperNext(): Promise<void> {
    const index = this.currentStepIndex();

    if (index === PAYMENT_STEP) {
      return;
    }

    if (!this.canAdvance()) {
      this.touchCurrentStep();
      return;
    }

    if (index === DETAILS_STEP) {
      await this.submitOrder();
      return;
    }

    this.currentStepIndex.update((i) => i + 1);
  }

  private touchCurrentStep(): void {
    switch (this.currentStepIndex()) {
      case FULFILLMENT_STEP:
        this.checkoutForm.fulfillmentMethod().markAsTouched();
        this.checkoutForm.slot().markAsTouched();
        this.checkoutForm.contentType().markAsTouched();
        break;
      case DETAILS_STEP:
        this.checkoutForm.firstName().markAsTouched();
        this.checkoutForm.lastName().markAsTouched();
        this.checkoutForm.email().markAsTouched();
        this.checkoutForm.address().markAsTouched();
        break;
    }
  }

  private async submitOrder(): Promise<void> {
    this.submitError.set(null);
    this.submitting.set(true);

    const model = this.checkoutModel();

    try {
      await firstValueFrom(
        this.orderService.placeOrder(
          {
            firstName: model.firstName,
            lastName: model.lastName,
            email: model.email,
            address: model.fulfillmentMethod === 'DELIVERY' ? model.address : undefined,
          },
          this.cart.lines(),
          {
            fulfillmentMethod: model.fulfillmentMethod as FulfillmentMethod,
            slot: model.slot,
            contentType: model.contentType as ContentType,
          },
        ),
      );

      this.placedWithName.set(model.firstName);
      this.placedWithEmail.set(model.email);
      this.cart.clear();
      this.orderPlaced.set(true);
      this.currentStepIndex.set(PAYMENT_STEP);
    } catch {
      this.submitError.set('Une erreur est survenue lors de l’envoi de la commande. Merci de réessayer.');
    } finally {
      this.submitting.set(false);
    }
  }

  private async loadFreshAvailability(): Promise<void> {
    try {
      const availability = await firstValueFrom(this.freshAvailabilityService.getCurrent());
      this.freshAvailability.set(availability);
    } catch {
      // Fresh unavailable to check → treat as closed rather than blocking checkout entirely.
      this.freshAvailability.set({ nextBatchDate: null, orderWindowOpen: false });
    }
  }
}
