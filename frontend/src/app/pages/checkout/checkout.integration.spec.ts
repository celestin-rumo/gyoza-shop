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
  });

  afterEach(() => httpMock.verify());

  function setInputValue(id: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(`#${id}`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('submits the order, empties the cart and shows the confirmation', async () => {
    setInputValue('firstName', 'Jean');
    setInputValue('lastName', 'Dupont');
    setInputValue('address', '1 rue du Test, Lausanne');
    setInputValue('email', 'jean.dupont@example.com');
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const req = httpMock.expectOne('/api/orders');
    expect(req.request.body).toEqual({
      customer: {
        firstName: 'Jean',
        lastName: 'Dupont',
        address: '1 rue du Test, Lausanne',
        email: 'jean.dupont@example.com',
      },
      lines: [{ packId: 10, quantity: 2 }],
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

  it('does not submit the order when a required field is left empty', async () => {
    setInputValue('firstName', 'Jean');
    // lastName / address / email left blank
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await fixture.whenStable();
    fixture.detectChanges();

    httpMock.expectNone('/api/orders');
    expect(cart.lines()).toHaveLength(1);
  });
});
