import { Component, ElementRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { email, form, FormField, FormRoot, hidden, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { SlotAvailabilityService } from '../../services/slot-availability.service';
import { SlotAvailability } from '../../models/slot-availability.model';
import { ContentType, FulfillmentMethod, formatTimeRange } from '../../models/fulfillment.model';
import {
  DsButtonComponent,
  DsCartAddEvent,
  DsCartItemComponent,
  DsOptionComponent,
  DsPricePipe,
  DsSectionHeaderComponent,
  DsStep,
  DsStepperComponent,
} from '../../design-system';

interface CheckoutFormModel {
  fulfillmentMethod: FulfillmentMethod | null;
  contentType: ContentType | null;
  date: string;
  startTime: string;
  endTime: string;
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
    DsOptionComponent,
    DsPricePipe,
    DsStepperComponent,
    DatePipe,
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
  private readonly slotAvailabilityService = inject(SlotAvailabilityService);
  protected readonly cart = inject(CartService);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly steps = STEPS;
  protected readonly formatTimeRange = formatTimeRange;

  protected readonly currentStepIndex = signal(CART_STEP);

  protected readonly orderPlaced = signal(false);
  protected readonly placedWithName = signal('');
  protected readonly placedWithEmail = signal('');

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly openSlots = signal<SlotAvailability[]>([]);

  protected readonly freshDisabled = computed(
    () => !this.openSlots().some((s) => s.fulfillmentMethod === this.checkoutModel().fulfillmentMethod && s.contentType === 'FRESH'),
  );
  protected readonly frozenDisabled = computed(
    () => !this.openSlots().some((s) => s.fulfillmentMethod === this.checkoutModel().fulfillmentMethod && s.contentType === 'FROZEN'),
  );

  private readonly stepHeading = viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');

  protected readonly checkoutModel = signal<CheckoutFormModel>({
    fulfillmentMethod: null,
    contentType: null,
    date: '',
    startTime: '',
    endTime: '',
    firstName: '',
    lastName: '',
    email: '',
    address: '',
  });

  protected readonly checkoutForm = form(this.checkoutModel, (path) => {
    required(path.fulfillmentMethod, { message: 'Choisissez un mode de récupération.' });
    required(path.contentType, { message: 'Choisissez frais ou surgelé.' });
    required(path.startTime, { message: 'Choisissez un créneau.' });

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

  /** Slots for the chosen method and content type — each slot now carries its own content type directly. */
  protected readonly slotOptions = computed<SlotAvailability[]>(() => {
    const { fulfillmentMethod, contentType } = this.checkoutModel();
    if (!fulfillmentMethod || !contentType) {
      return [];
    }

    return this.openSlots()
      .filter((slot) => slot.fulfillmentMethod === fulfillmentMethod && slot.contentType === contentType)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  });

  protected readonly canAdvance = computed(() => {
    switch (this.currentStepIndex()) {
      case FULFILLMENT_STEP:
        return (
          this.checkoutForm.fulfillmentMethod().valid() &&
          this.checkoutForm.contentType().valid() &&
          this.checkoutForm.startTime().valid()
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
    this.loadOpenSlots();
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

  protected goToShop(): void {
    this.router.navigateByUrl('/nos-gyozas');
  }

  protected goToCartStep(): void {
    this.currentStepIndex.set(CART_STEP);
  }

  protected goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
  }

  protected selectFulfillmentMethod(method: FulfillmentMethod): void {
    this.checkoutModel.update((model) => ({
      ...model,
      fulfillmentMethod: method,
      contentType: null,
      date: '',
      startTime: '',
      endTime: '',
    }));
    this.checkoutForm.fulfillmentMethod().markAsTouched();
  }

  protected selectContentType(contentType: ContentType): void {
    if ((contentType === 'FRESH' && this.freshDisabled()) || (contentType === 'FROZEN' && this.frozenDisabled())) {
      return;
    }

    this.checkoutModel.update((model) => ({ ...model, contentType, date: '', startTime: '', endTime: '' }));
    this.checkoutForm.contentType().markAsTouched();
  }

  protected selectSlot(option: SlotAvailability): void {
    this.checkoutModel.update((model) => ({
      ...model,
      date: option.date,
      startTime: option.startTime,
      endTime: option.endTime,
    }));
    this.checkoutForm.startTime().markAsTouched();
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
        this.checkoutForm.contentType().markAsTouched();
        this.checkoutForm.startTime().markAsTouched();
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
            date: model.date,
            startTime: model.startTime,
            endTime: model.endTime,
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

  private async loadOpenSlots(): Promise<void> {
    try {
      const slots = await firstValueFrom(this.slotAvailabilityService.getOpenSlots());
      this.openSlots.set(slots);
    } catch {
      this.openSlots.set([]);
    }
  }
}
