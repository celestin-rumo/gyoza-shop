import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { AdminRawMaterialPurchases } from './admin-raw-material-purchases';
import { RawMaterial } from '../../../models/raw-material.model';
import { RawMaterialPurchase } from '../../../models/raw-material-purchase.model';

describe('AdminRawMaterialPurchases', () => {
  let fixture: ComponentFixture<AdminRawMaterialPurchases>;
  let httpMock: HttpTestingController;

  const rawMaterials: RawMaterial[] = [
    { id: 1, name: 'Farine', unit: 'kg', referenceUnitPrice: 2.5, lastPurchaseDate: '2026-08-10' },
    { id: 2, name: 'Gingembre', unit: 'kg', referenceUnitPrice: null, lastPurchaseDate: null },
  ];

  const existingPurchase: RawMaterialPurchase = {
    id: 10,
    rawMaterialId: 1,
    rawMaterialName: 'Farine',
    date: '2026-08-10',
    quantityPurchased: 10,
    totalPricePaid: 25,
    unitPrice: 2.5,
    source: 'MANUAL',
    originCountry: 'Suisse',
    store: 'Coop',
    batchNumber: 'LOT-001',
  };

  function setup(queryParamRawMaterialId: string | null = null): void {
    TestBed.configureTestingModule({
      imports: [AdminRawMaterialPurchases],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(
                queryParamRawMaterialId ? { rawMaterialId: queryParamRawMaterialId } : {},
              ),
            },
          },
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminRawMaterialPurchases);
    fixture.detectChanges();
  }

  function clickButton(name: string): void {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const button = buttons.find((candidate) => candidate.textContent?.trim() === name);
    if (!button) {
      throw new Error(`No button found matching ${name}`);
    }
    button.click();
  }

  async function flushRawMaterials(): Promise<void> {
    httpMock.expectOne('/api/admin/raw-materials').flush(rawMaterials);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function selectRawMaterialInDropdown(id: string): void {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#rawMaterialSelect');
    select.value = id;
    select.dispatchEvent(new Event('change'));
  }

  afterEach(() => httpMock.verify());

  it('prompts to select a raw material before showing the form', async () => {
    setup();
    await flushRawMaterials();

    expect(fixture.nativeElement.textContent).toContain('Sélectionnez une matière première');
  });

  it('preselects the raw material from the rawMaterialId query param and loads its history', async () => {
    setup('1');
    await flushRawMaterials();

    httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=1').flush([existingPurchase]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Historique — Farine');
    expect(fixture.nativeElement.textContent).toContain('Coop');
  });

  it('loads and displays the purchase history when a material is selected from the dropdown', async () => {
    setup();
    await flushRawMaterials();

    selectRawMaterialInDropdown('1');

    httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=1').flush([existingPurchase]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Suisse');
    expect(fixture.nativeElement.textContent).toContain('Coop');
    expect(fixture.nativeElement.textContent).toContain('LOT-001');
    expect(fixture.nativeElement.textContent).toContain('CHF 2.50');
  });

  it('shows a hint when a selected material has no purchase history yet', async () => {
    setup();
    await flushRawMaterials();

    selectRawMaterialInDropdown('2');

    httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=2').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucun achat enregistré pour cette matière première.');
  });

  it('adjusts quantity and price via the +/- stepper buttons', async () => {
    setup('1');
    await flushRawMaterials();
    httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=1').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const quantityInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="la quantité"]',
    );
    const priceInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="le prix payé"]',
    );
    expect(quantityInput.value).toBe('0');
    expect(priceInput.value).toBe('0');

    (fixture.nativeElement.querySelector('button[aria-label="Augmenter la quantité"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(quantityInput.value).toBe('0.1');

    (fixture.nativeElement.querySelector('button[aria-label="Augmenter le prix payé"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(priceInput.value).toBe('1');
  });

  it('submits a new purchase with all fields and refreshes the history and catalog', async () => {
    setup('1');
    await flushRawMaterials();
    httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=1').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const form: HTMLElement = fixture.nativeElement.querySelector('.admin-raw-material-purchases__form');

    const dateInput: HTMLInputElement = form.querySelector('input[type="date"]')!;
    dateInput.value = '2026-08-20';
    dateInput.dispatchEvent(new Event('input'));

    const numberInputs: HTMLInputElement[] = Array.from(form.querySelectorAll('input[type="number"]'));
    numberInputs[0].value = '5';
    numberInputs[0].dispatchEvent(new Event('input'));
    numberInputs[1].value = '15';
    numberInputs[1].dispatchEvent(new Event('input'));

    const textInputs: HTMLInputElement[] = Array.from(form.querySelectorAll('input[type="text"]'));
    textInputs[0].value = 'Suisse';
    textInputs[0].dispatchEvent(new Event('input'));
    textInputs[1].value = 'Coop';
    textInputs[1].dispatchEvent(new Event('input'));
    textInputs[2].value = 'LOT-042';
    textInputs[2].dispatchEvent(new Event('input'));

    fixture.detectChanges();

    clickButton("Ajouter l'achat");

    const req = httpMock.expectOne('/api/admin/raw-material-purchases');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      rawMaterialId: 1,
      date: '2026-08-20',
      quantityPurchased: 5,
      totalPricePaid: 15,
      source: 'MANUAL',
      originCountry: 'Suisse',
      store: 'Coop',
      batchNumber: 'LOT-042',
    });

    req.flush({
      id: 11,
      rawMaterialId: 1,
      rawMaterialName: 'Farine',
      date: '2026-08-20',
      quantityPurchased: 5,
      totalPricePaid: 15,
      unitPrice: 3,
      source: 'MANUAL',
      originCountry: 'Suisse',
      store: 'Coop',
      batchNumber: 'LOT-042',
    });
    await fixture.whenStable();

    // The history and catalog refreshes fire in parallel once the purchase is saved.
    httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=1').flush([{
      id: 11,
      rawMaterialId: 1,
      rawMaterialName: 'Farine',
      date: '2026-08-20',
      quantityPurchased: 5,
      totalPricePaid: 15,
      unitPrice: 3,
      source: 'MANUAL',
      originCountry: 'Suisse',
      store: 'Coop',
      batchNumber: 'LOT-042',
    }]);
    httpMock.expectOne('/api/admin/raw-materials').flush([
      { ...rawMaterials[0], referenceUnitPrice: 3, lastPurchaseDate: '2026-08-20' },
      rawMaterials[1],
    ]);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('LOT-042');
  });

  it('keeps the submit button disabled until the required provenance fields are filled in', async () => {
    setup('1');
    await flushRawMaterials();
    httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=1').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const form: HTMLElement = fixture.nativeElement.querySelector('.admin-raw-material-purchases__form');
    const numberInputs: HTMLInputElement[] = Array.from(form.querySelectorAll('input[type="number"]'));
    numberInputs[0].value = '5';
    numberInputs[0].dispatchEvent(new Event('input'));
    numberInputs[1].value = '15';
    numberInputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const submitButton = buttons.find(
      (candidate) => candidate.textContent?.trim() === "Ajouter l'achat",
    ) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);

    httpMock.expectNone('/api/admin/raw-material-purchases');
  });
});
