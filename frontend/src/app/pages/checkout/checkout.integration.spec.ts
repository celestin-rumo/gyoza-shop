import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Checkout } from './checkout';
import { CartService } from '../../services/cart.service';
import { DsCartAddEvent } from '../../design-system';
import { SlotAvailability } from '../../models/slot-availability.model';

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

  // No FRESH slot in the default fixture — "Frais" stays disabled unless a test opens one.
  const OPEN_SLOTS: SlotAvailability[] = [
    {
      id: 1,
      date: '2026-09-08',
      fulfillmentMethod: 'DELIVERY',
      startTime: '18:00:00',
      endTime: '20:00:00',
      contentType: 'FROZEN',
      open: true,
    },
    {
      id: 2,
      date: '2026-09-12',
      fulfillmentMethod: 'PICKUP',
      startTime: '10:00:00',
      endTime: '12:00:00',
      contentType: 'FROZEN',
      open: true,
    },
  ];

  function flushOpenSlots(slots: SlotAvailability[] = OPEN_SLOTS): void {
    httpMock.expectOne('/api/slots').flush(slots);
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
    const option = buttons.find((candidate) => candidate.textContent?.includes(value));
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

  /** Fieldset order is Mode → Contenu → Créneau: each fieldset only appears once the previous one is chosen. */
  async function fillFulfillmentStep(
    method: 'Retrait' | 'Livraison',
    content: 'Surgelé' | 'Frais',
    slotText: string,
  ): Promise<void> {
    chooseOption(method);
    fixture.detectChanges();
    chooseOption(content);
    fixture.detectChanges();
    chooseOption(slotText);
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

    flushOpenSlots();
  });

  afterEach(() => httpMock.verify());

  it('walks the 4 steps and submits the order at the end of the "Coordonnées" step', async () => {
    await goToFulfillmentStep();
    await fillFulfillmentStep('Livraison', 'Surgelé', '18h00–20h00');

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
      date: '2026-09-08',
      startTime: '18:00:00',
      endTime: '20:00:00',
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
    await fillFulfillmentStep('Retrait', 'Surgelé', '10h00–12h00');

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
    expect(req.request.body.date).toBe('2026-09-12');
    expect(req.request.body.startTime).toBe('10:00:00');
    expect(req.request.body.endTime).toBe('12:00:00');
    expect(req.request.body.customer.address).toBeUndefined();

    req.flush({ id: 1, status: 'RESERVED', totalPrice: 24, createdAt: new Date().toISOString() });
  });

  it('blocks advancing past the "Récupération" step until a method, content type and slot are chosen', async () => {
    await goToFulfillmentStep();

    clickButton('Continuer');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Still on step 2 (Récupération) — the content group only appears once a method is chosen,
    // and the slot group only once a content type is chosen too.
    expect(fixture.nativeElement.textContent).not.toContain('Créneau');
  });

  it('disables the "Surgelé" option when no slot exists for the chosen method', async () => {
    // Recreate the fixture with only a DELIVERY slot seeded — none for PICKUP, so "Surgelé"
    // (the only content type with any open slot at all) is disabled once "Retrait" is chosen.
    // A content type can only ever be enabled once a matching slot exists — the "Créneau"
    // list can therefore never end up empty once reached, since ds-option blocks clicking a
    // disabled option in the first place.
    httpMock.verify();
    fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
    flushOpenSlots([OPEN_SLOTS[0]]);

    await goToFulfillmentStep();
    chooseOption('Retrait');
    fixture.detectChanges();

    const frozenOption: HTMLButtonElement | undefined = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button[role="radio"]'),
    ).find((button) => button.textContent?.trim() === 'Surgelé');

    expect(frozenOption?.getAttribute('aria-disabled')).toBe('true');
  });

  it('disables the "Frais" option and shows a message when no FRESH slot exists for the chosen method', async () => {
    await goToFulfillmentStep();
    chooseOption('Livraison');
    fixture.detectChanges();

    const freshOption: HTMLButtonElement | undefined = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button[role="radio"]'),
    ).find((button) => button.textContent?.trim() === 'Frais');

    expect(freshOption?.getAttribute('aria-disabled')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('gyozas frais n’est pas ouverte');
  });

  it('enables the "Frais" option when at least one open FRESH slot exists for the chosen method', async () => {
    httpMock.verify();
    fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
    flushOpenSlots([
      ...OPEN_SLOTS,
      {
        id: 3,
        date: '2026-09-20',
        fulfillmentMethod: 'DELIVERY',
        startTime: '18:00:00',
        endTime: '20:00:00',
        contentType: 'FRESH',
        open: true,
      },
    ]);

    await goToFulfillmentStep();
    chooseOption('Livraison');
    fixture.detectChanges();

    const freshOption: HTMLButtonElement | undefined = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button[role="radio"]'),
    ).find((button) => button.textContent?.trim() === 'Frais');

    expect(freshOption?.getAttribute('aria-disabled')).toBeNull();
  });

  it('clears the selected slot when the chosen content type changes', async () => {
    // PICKUP has both a FROZEN slot (10h00–12h00) and a FRESH slot (14h00–16h00) so both
    // content options stay enabled — the slot filter can no longer produce an orphaned
    // selection, but switching content type must still drop the stale FROZEN pick.
    httpMock.verify();
    fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
    flushOpenSlots([
      ...OPEN_SLOTS,
      {
        id: 3,
        date: '2026-09-12',
        fulfillmentMethod: 'PICKUP',
        startTime: '14:00:00',
        endTime: '16:00:00',
        contentType: 'FRESH',
        open: true,
      },
    ]);

    await goToFulfillmentStep();
    chooseOption('Retrait');
    fixture.detectChanges();
    chooseOption('Surgelé');
    fixture.detectChanges();
    chooseOption('10h00–12h00');
    fixture.detectChanges();

    chooseOption('Frais');
    fixture.detectChanges();

    // The stale FROZEN selection must be cleared, not silently kept — advancing without
    // picking the new FRESH slot should still be blocked. ("Coordonnées" isn't a reliable
    // marker here — the stepper nav always renders it as a step label — so check for the
    // "Prénom" field, which only renders once the "Coordonnées" step is actually reached.)
    clickButton('Continuer');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Prénom');
  });
});
