import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { AdminRawMaterials } from './admin-raw-materials';
import { RawMaterial } from '../../../models/raw-material.model';
import { RawMaterialPurchase } from '../../../models/raw-material-purchase.model';

describe('AdminRawMaterials', () => {
  let fixture: ComponentFixture<AdminRawMaterials>;
  let httpMock: HttpTestingController;

  const existingRawMaterial: RawMaterial = {
    id: 1,
    name: 'Farine',
    unit: 'kg',
    referenceUnitPrice: 2.5,
    lastPurchaseDate: '2026-08-10',
  };

  const secondRawMaterial: RawMaterial = {
    id: 2,
    name: 'Gingembre',
    unit: 'kg',
    referenceUnitPrice: null,
    lastPurchaseDate: null,
  };

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

  /**
   * ngOnInit awaits the raw materials fetch, then chains into loadPurchases() — settling
   * that extra async hop takes more than one whenStable() tick (same pattern as elsewhere
   * in this app whenever ngOnInit awaits more than a single request in sequence).
   */
  async function settle(): Promise<void> {
    await fixture.whenStable();
    await fixture.whenStable();
    await fixture.whenStable();
  }

  async function flushLoad(
    rawMaterials: RawMaterial[] = [existingRawMaterial],
    purchases: RawMaterialPurchase[] = [],
  ): Promise<void> {
    httpMock.expectOne('/api/admin/raw-materials').flush(rawMaterials);
    await settle();
    httpMock.expectOne('/api/admin/raw-material-purchases').flush(purchases);
    await settle();
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

  function setInputValue(selector: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function setup(queryParamRawMaterialId: string | null = null): void {
    TestBed.configureTestingModule({
      imports: [AdminRawMaterials],
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
    fixture = TestBed.createComponent(AdminRawMaterials);
    fixture.detectChanges();
  }

  beforeEach(() => setup());

  afterEach(() => httpMock.verify());

  it('loads and displays the raw materials catalog with its reference price', async () => {
    await flushLoad();

    expect(fixture.nativeElement.textContent).toContain('Farine');
    expect(fixture.nativeElement.textContent).toContain('kg');
    expect(fixture.nativeElement.textContent).toContain('CHF 2.50');
    expect(fixture.nativeElement.textContent).toContain('2026-08-10');
  });

  it('shows a hint when a raw material has no purchase yet', async () => {
    await flushLoad([{ ...existingRawMaterial, referenceUnitPrice: null, lastPurchaseDate: null }]);

    expect(fixture.nativeElement.textContent).toContain('Aucun achat enregistré');
  });

  it('shows an error message when loading fails', async () => {
    httpMock.expectOne('/api/admin/raw-materials').flush('error', { status: 500, statusText: 'Server Error' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger');
  });

  it('creates a new raw material from the form', async () => {
    await flushLoad([]);

    setInputValue('#rawMaterialName', 'Gingembre');
    setInputValue('#rawMaterialUnit', 'kg');
    fixture.detectChanges();

    const forms: HTMLFormElement[] = Array.from(fixture.nativeElement.querySelectorAll('form'));
    forms[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const req = httpMock.expectOne('/api/admin/raw-materials');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Gingembre', unit: 'kg' });

    req.flush({ id: 2, name: 'Gingembre', unit: 'kg', referenceUnitPrice: null, lastPurchaseDate: null });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Gingembre');
  });

  it('edits an existing raw material and saves it via PUT', async () => {
    await flushLoad();

    clickButton('Modifier');
    fixture.detectChanges();

    setInputValue('.admin-raw-material__input:not(.admin-raw-material__input--sm)', 'Farine de blé');

    const unitInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '.admin-raw-material__input--sm',
    );
    unitInput.value = 'g';
    unitInput.dispatchEvent(new Event('input'));

    clickButton('Enregistrer');

    const req = httpMock.expectOne('/api/admin/raw-materials/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Farine de blé', unit: 'g' });

    req.flush({ id: 1, name: 'Farine de blé', unit: 'g', referenceUnitPrice: 2.5, lastPurchaseDate: '2026-08-10' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Farine de blé');
  });

  it('deletes a raw material after confirmation', async () => {
    await flushLoad();

    window.confirm = vi.fn().mockReturnValue(true);

    clickButton('Supprimer');

    const req = httpMock.expectOne('/api/admin/raw-materials/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucune matière première');
  });

  it('does not delete a raw material when the confirmation is declined', async () => {
    await flushLoad();

    window.confirm = vi.fn().mockReturnValue(false);

    clickButton('Supprimer');

    httpMock.expectNone('/api/admin/raw-materials/1');
  });

  describe('achats section', () => {
    it('defaults to showing all purchases, with a column identifying the material', async () => {
      await flushLoad([existingRawMaterial, secondRawMaterial], [existingPurchase]);

      const achatsSection = fixture.nativeElement.querySelector('.admin-raw-materials__achats') as HTMLElement;
      expect(achatsSection.textContent).toContain('Farine');
      expect(achatsSection.textContent).toContain('Coop');

      // No material selected: the entry form isn't shown, only the history.
      expect(achatsSection.textContent).not.toContain("Ajouter l'achat");
    });

    it('filters the history and reveals the purchase form when a material is selected', async () => {
      await flushLoad([existingRawMaterial, secondRawMaterial], []);

      const filter: HTMLSelectElement = fixture.nativeElement.querySelector('#purchaseFilter');
      filter.value = '1';
      filter.dispatchEvent(new Event('change'));

      httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=1').flush([existingPurchase]);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Enregistrer un achat — Farine');
      expect(fixture.nativeElement.textContent).toContain('Coop');
    });

    it('jumps to and filters the achats section from a catalog row’s "Historique des achats"', async () => {
      await flushLoad([existingRawMaterial, secondRawMaterial], []);

      clickButton('Historique des achats');
      fixture.detectChanges();

      httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=1').flush([existingPurchase]);
      await fixture.whenStable();
      fixture.detectChanges();

      const achatsSection = fixture.nativeElement.querySelector('.admin-raw-materials__achats') as HTMLElement;
      expect(achatsSection.textContent).toContain('Enregistrer un achat — Farine');
      expect(achatsSection.textContent).toContain('Coop');
    });

    it('submits a new purchase for the selected material and refreshes the history and catalog', async () => {
      await flushLoad([existingRawMaterial], []);

      const filter: HTMLSelectElement = fixture.nativeElement.querySelector('#purchaseFilter');
      filter.value = '1';
      filter.dispatchEvent(new Event('change'));

      httpMock.expectOne('/api/admin/raw-material-purchases?rawMaterialId=1').flush([]);
      await fixture.whenStable();
      fixture.detectChanges();

      const form: HTMLElement = fixture.nativeElement.querySelector('.admin-raw-materials__purchase-form');

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
        batchNumber: null,
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
        batchNumber: null,
      });
      await fixture.whenStable();

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
        batchNumber: null,
      }]);
      httpMock.expectOne('/api/admin/raw-materials').flush([
        { ...existingRawMaterial, referenceUnitPrice: 3, lastPurchaseDate: '2026-08-20' },
      ]);

      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('2026-08-20');
    });
  });
});
