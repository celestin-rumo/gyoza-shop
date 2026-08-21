import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Checkout } from './checkout';
import { CartService } from '../../services/cart.service';
import { DsCartAddEvent } from '../../design-system';

/**
 * Integration test: the real page component, the real CartService and the real
 * Signal Forms wiring are exercised together — only the network boundary
 * (`HttpTestingController`) is faked. Unlike the unit specs, this validates that
 * the pieces are correctly assembled, not just that each one works in isolation.
 */
describe('Checkout (integration)', () => {
  let fixture: ComponentFixture<Checkout>;
  let cart: CartService;
  let httpMock: HttpTestingController;

  const cartLine: DsCartAddEvent = {
    product: {
      id: 1,
      tagTone: 'accent',
      imageUrl: '',
      imageAlt: '',
      name: 'Chicken',
      description: '',
      packs: [],
    },
    pack: { id: 10, count: 6, price: 12, label: 'Pack de 6' },
    quantity: 2,
  };

  function flushFreshAvailability(orderWindowOpen = false): void {
    const req = httpMock.expectOne('/api/fresh-availability');
    req.flush({ nextBatchDate: orderWindowOpen ? '2026-09-15' : null, orderWindowOpen });
  }

  function clickButton(name: RegExp | string): void {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const button = buttons.find((candidate) =>
      typeof name === 'string' ? candidate.textContent?.trim() === name : name.test(candidate.textContent ?? ''),
    );
    if (!button) {
      throw new Error(`No button found matching ${name}`);
    }
    button.click();
  }

  function setInputValue(id: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(`#${id}`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function chooseOption(value: string): void {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button[role="radio"]'),
    );
    const option = buttons.find((candidate) => candidate.textContent?.trim() === value);
    if (!option) {
      throw new Error(`No ds-option found for ${value}`);
    }
    option.click();
  }

  async function goToFulfillmentStep(): Promise<void> {
    clickButton('Continuer');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function fillFulfillmentStep(method: 'Retrait' | 'Livraison', slotText: string, content: 'Surgelé' | 'Frais'): Promise<void> {
    chooseOption(method);
    fixture.detectChanges();
    chooseOption(slotText);
    fixture.detectChanges();
    chooseOption(content);
    fixture.detectChanges();
    clickButton('Continuer');
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    cart = TestBed.inject(CartService);
    cart.add(cartLine);

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();

    flushFreshAvailability(false);
  });

  afterEach(() => httpMock.verify());

  it('walks the 4 steps and submits the order at the end of the "Coordonnées" step', async () => {
    await goToFulfillmentStep();
    await fillFulfillmentStep('Livraison', 'Mardi 18h–20h', 'Surgelé');

    setInputValue('firstName', 'Jean');
    setInputValue('lastName', 'Dupont');
    setInputValue('email', 'jean.dupont@example.com');
    setInputValue('address', '1 rue du Test, Lausanne');
    fixture.detectChanges();

    clickButton('Payer');
    fixture.detectChanges();
    await fixture.whenStable();

    const req = httpMock.expectOne('/api/orders');
    expect(req.request.body).toEqual({
      customer: {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        address: '1 rue du Test, Lausanne',
      },
      lines: [{ packId: 10, quantity: 2 }],
      fulfillmentMethod: 'DELIVERY',
      slot: 'MARDI_18H_20H',
      contentType: 'FROZEN',
    });

    req.flush({
      id: 1,
      status: 'RESERVED',
      totalPrice: 24,
      createdAt: new Date().toISOString(),
    });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(cart.lines()).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('Commande envoyée');
  });

  it('does not require an address for a pickup order', async () => {
    await goToFulfillmentStep();
    await fillFulfillmentStep('Retrait', 'Samedi 10h–12h', 'Surgelé');

    setInputValue('firstName', 'Jean');
    setInputValue('lastName', 'Dupont');
    setInputValue('email', 'jean.dupont@example.com');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#address')).toBeNull();

    clickButton('Payer');
    fixture.detectChanges();
    await fixture.whenStable();

    const req = httpMock.expectOne('/api/orders');
    expect(req.request.body.fulfillmentMethod).toBe('PICKUP');
    expect(req.request.body.slot).toBe('SAMEDI_10H_12H');
    expect(req.request.body.customer.address).toBeUndefined();

    req.flush({ id: 1, status: 'RESERVED', totalPrice: 24, createdAt: new Date().toISOString() });
  });

  it('blocks advancing past the "Récupération" step until a method, slot and content type are chosen', async () => {
    await goToFulfillmentStep();

    clickButton('Continuer');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Still on step 2 (Récupération) — the slot group only appears once a method is chosen.
    expect(fixture.nativeElement.textContent).not.toContain('Créneau');
  });

  it('disables the "Frais" option and shows a message when the order window is closed', async () => {
    await goToFulfillmentStep();

    const freshOption: HTMLButtonElement | undefined = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button[role="radio"]'),
    ).find((button) => button.textContent?.trim() === 'Frais');

    expect(freshOption?.getAttribute('aria-disabled')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('gyozas frais n’est pas ouverte');
  });
});
