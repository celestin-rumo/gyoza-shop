import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminStocks } from './admin-stocks';
import { Product } from '../../../models/product.model';

/**
 * Integration-style: renders the real AdminProductRow/AdminPackRow children (not mocked),
 * so this also exercises the ds-number-stepper wiring introduced in all three components.
 */
describe('AdminStocks', () => {
  let fixture: ComponentFixture<AdminStocks>;
  let httpMock: HttpTestingController;

  const existingProduct: Product = {
    id: 1,
    name: 'Chicken',
    stockQuantity: 200,
    active: true,
    packs: [{ id: 10, size: 6, price: 12 }],
  };

  function clickButton(name: string): void {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const button = buttons.find((candidate) => candidate.textContent?.trim() === name);
    if (!button) {
      throw new Error(`No button found matching ${name}`);
    }
    button.click();
  }

  function clickAriaLabel(label: string): void {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(`button[aria-label="${label}"]`);
    if (!button) {
      throw new Error(`No button found with aria-label "${label}"`);
    }
    button.click();
    fixture.detectChanges();
  }

  async function flushLoad(products: Product[] = [existingProduct]): Promise<void> {
    httpMock.expectOne('/api/admin/products').flush(products);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminStocks],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminStocks);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('creates a new product using the name field and the initial-stock stepper', async () => {
    await flushLoad([]);

    const nameInput: HTMLInputElement = fixture.nativeElement.querySelector('#productName');
    nameInput.value = 'Porc';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    clickAriaLabel('Augmenter le stock initial');
    clickAriaLabel('Augmenter le stock initial');

    const forms: HTMLFormElement[] = Array.from(fixture.nativeElement.querySelectorAll('form'));
    forms[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const req = httpMock.expectOne('/api/admin/products');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Porc', initialStock: 2 });

    req.flush({ id: 2, name: 'Porc', stockQuantity: 2, active: true, packs: [] });
    httpMock.expectOne('/api/products').flush([]);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Porc');
  });

  it('never lets the initial-stock stepper go below zero', async () => {
    await flushLoad([]);

    clickAriaLabel('Diminuer le stock initial');

    const stockInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="le stock initial"]',
    );
    expect(stockInput.value).toBe('0');
  });

  it('adds stock to an existing product via the adjustment stepper and confirm popup', async () => {
    await flushLoad();

    // stockDelta defaults to 1; one increment brings it to 2.
    clickAriaLabel("Augmenter l'ajustement de stock");
    clickButton('Valider');
    fixture.detectChanges();
    clickButton('Confirmer');

    const req = httpMock.expectOne('/api/admin/products/1/stock');
    expect(req.request.body).toEqual({ quantity: 2 });

    req.flush({ ...existingProduct, stockQuantity: 202 });
    httpMock.expectOne('/api/products').flush([]);
    await fixture.whenStable();
  });

  it('removes stock from a specific lot via the adjustment stepper and confirm popup', async () => {
    await flushLoad();

    // stockDelta defaults to 1; two decrements bring it to -1.
    clickAriaLabel("Diminuer l'ajustement de stock");
    clickAriaLabel("Diminuer l'ajustement de stock");
    clickButton('Valider');
    fixture.detectChanges();

    httpMock
      .expectOne('/api/admin/products/1/lots')
      .flush([{ productOutputId: 5, batchNumber: 'L20260810-01', date: '2026-08-10', remainingQuantity: 20 }]);
    await fixture.whenStable();
    fixture.detectChanges();

    clickButton('Confirmer');

    const req = httpMock.expectOne('/api/admin/products/1/stock/remove-from-lot');
    expect(req.request.body).toEqual({ productOutputId: 5, quantity: 1 });

    req.flush({ ...existingProduct, stockQuantity: 199 });
    httpMock.expectOne('/api/products').flush([]);
    await fixture.whenStable();
  });

  it('adds a pack using the quantity and price steppers', async () => {
    await flushLoad();

    // newPackSize defaults to 6, newPackPrice to 0.
    clickAriaLabel('Augmenter la quantité du nouveau pack');
    clickAriaLabel('Augmenter le prix du nouveau pack');
    clickAriaLabel('Augmenter le prix du nouveau pack');

    clickButton('Ajouter un pack');

    const req = httpMock.expectOne('/api/admin/products/1/packs');
    expect(req.request.body).toEqual({ size: 7, price: 2 });

    req.flush({ id: 11, size: 7, price: 2 });
    httpMock.expectOne('/api/products').flush([]);
    await fixture.whenStable();
  });

  it('edits an existing pack via its own stepper controls', async () => {
    await flushLoad();

    clickButton('Modifier');
    fixture.detectChanges();

    // The edit form is pre-filled from the existing pack (size 6, price 12).
    clickAriaLabel('Augmenter la quantité de ce pack');

    clickButton('Enregistrer');

    const req = httpMock.expectOne('/api/admin/packs/10');
    expect(req.request.body).toEqual({ size: 7, price: 12 });

    req.flush({ id: 10, size: 7, price: 12 });
    httpMock.expectOne('/api/products').flush([]);
    await fixture.whenStable();
  });
});
