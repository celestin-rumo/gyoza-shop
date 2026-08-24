import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminRawMaterials } from './admin-raw-materials';
import { RawMaterial } from '../../../models/raw-material.model';

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

  async function flushLoad(rawMaterials: RawMaterial[] = [existingRawMaterial]): Promise<void> {
    httpMock.expectOne('/api/admin/raw-materials').flush(rawMaterials);
    await fixture.whenStable();
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminRawMaterials],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminRawMaterials);
    fixture.detectChanges();
  });

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
});
