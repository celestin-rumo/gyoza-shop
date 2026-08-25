import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminProductionSessions } from './admin-production-sessions';
import { ProductionSession } from '../../../models/production-session.model';
import { RawMaterial } from '../../../models/raw-material.model';
import { Product } from '../../../models/product.model';
import { AdminUser } from '../../../services/admin-user.service';

describe('AdminProductionSessions', () => {
  let fixture: ComponentFixture<AdminProductionSessions>;
  let httpMock: HttpTestingController;

  const rawMaterials: RawMaterial[] = [
    { id: 1, name: 'Farine', unit: 'kg', referenceUnitPrice: 2.5, lastPurchaseDate: '2026-08-10' },
  ];

  const products: Product[] = [{ id: 1, name: 'Chicken', stockQuantity: 200, active: true, packs: [] }];

  const admins: AdminUser[] = [
    { id: 'user-1', email: 'admin@example.com', firstName: 'Cel', lastName: 'Nino', role: 'ADMIN', primaryAdmin: true },
  ];

  const existingSession: ProductionSession = {
    id: 1,
    date: '2026-08-10',
    batchNumber: 'L20260810-01',
    notes: 'Session du samedi',
    rawMaterialUsages: [{ rawMaterialId: 1, rawMaterialName: 'Farine', unit: 'kg', quantityUsed: 3.5 }],
    participants: [{ userId: 'user-1', userName: 'Cel Nino', hoursSpent: 4 }],
    outputs: [{ productId: 1, productName: 'Chicken', quantityProduced: 80 }],
  };

  /**
   * ngOnInit awaits `Promise.all([...])` over four requests — settling that chain takes a few
   * more microtask turns than a single awaited request, so `whenStable()` needs several calls.
   */
  async function settle(): Promise<void> {
    await fixture.whenStable();
    await fixture.whenStable();
    await fixture.whenStable();
  }

  async function flushInit(sessions: ProductionSession[] = [existingSession]): Promise<void> {
    httpMock.expectOne('/api/admin/production-sessions').flush(sessions);
    httpMock.expectOne('/api/admin/raw-materials').flush(rawMaterials);
    httpMock.expectOne('/api/admin/products').flush(products);
    httpMock.expectOne('/api/admin/users?role=ADMIN').flush(admins);
    await settle();
    fixture.detectChanges();
  }

  function clickButton(name: string, index = 0): void {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const matches = buttons.filter((candidate) => candidate.textContent?.trim() === name);
    if (!matches[index]) {
      throw new Error(`No button (index ${index}) found matching ${name}`);
    }
    matches[index].click();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminProductionSessions],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminProductionSessions);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('loads and displays the session history', async () => {
    await flushInit();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('L20260810-01');
    expect(text).toContain('2026-08-10');
    expect(text).toContain('Session du samedi');
    expect(text).toContain('Farine — 3.5 kg');
    expect(text).toContain('Cel Nino — 4 h');
    expect(text).toContain('Chicken — +80');
  });

  it('shows an error message when loading fails', async () => {
    httpMock.expectOne('/api/admin/production-sessions').flush('error', { status: 500, statusText: 'Server Error' });
    httpMock.expectOne('/api/admin/raw-materials').flush([]);
    httpMock.expectOne('/api/admin/products').flush([]);
    httpMock.expectOne('/api/admin/users?role=ADMIN').flush([]);
    await settle();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger');
  });

  it('shows a hint when there is no session history yet', async () => {
    await flushInit([]);

    expect(fixture.nativeElement.textContent).toContain('Aucune session enregistrée pour le moment.');
  });

  it('keeps the submit button disabled until every line category has a valid entry', async () => {
    await flushInit();

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const submitButton = buttons.find(
      (candidate) => candidate.textContent?.trim() === 'Enregistrer la session',
    ) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);

    httpMock.expectNone('/api/admin/production-sessions');
  });

  it('adds and removes raw material lines', async () => {
    await flushInit();

    expect(fixture.nativeElement.querySelectorAll('.admin-production-sessions__lines')[0]
      .querySelectorAll('.admin-production-sessions__line').length).toBe(1);

    clickButton('+ Ajouter une matière première');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.admin-production-sessions__lines')[0]
      .querySelectorAll('.admin-production-sessions__line').length).toBe(2);

    clickButton('Retirer', 1);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.admin-production-sessions__lines')[0]
      .querySelectorAll('.admin-production-sessions__line').length).toBe(1);
  });

  it('submits a new session with filled-in lines and prepends it to the history', async () => {
    await flushInit([]);

    const dateInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '.admin-production-sessions__top-fields input[type="date"]',
    );
    dateInput.value = '2026-08-20';
    dateInput.dispatchEvent(new Event('input'));

    const lineSections = fixture.nativeElement.querySelectorAll('.admin-production-sessions__lines');

    const rawMaterialSelect: HTMLSelectElement = lineSections[0].querySelector('select');
    rawMaterialSelect.value = '1';
    rawMaterialSelect.dispatchEvent(new Event('change'));
    const rawMaterialQtyInput: HTMLInputElement = lineSections[0].querySelector('input[type="number"]');
    rawMaterialQtyInput.value = '3.5';
    rawMaterialQtyInput.dispatchEvent(new Event('input'));

    const participantSelect: HTMLSelectElement = lineSections[1].querySelector('select');
    participantSelect.value = 'user-1';
    participantSelect.dispatchEvent(new Event('change'));
    const hoursInput: HTMLInputElement = lineSections[1].querySelector('input[type="number"]');
    hoursInput.value = '4';
    hoursInput.dispatchEvent(new Event('input'));

    const outputSelect: HTMLSelectElement = lineSections[2].querySelector('select');
    outputSelect.value = '1';
    outputSelect.dispatchEvent(new Event('change'));
    const quantityInput: HTMLInputElement = lineSections[2].querySelector('input[type="number"]');
    quantityInput.value = '80';
    quantityInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    clickButton('Enregistrer la session');

    const req = httpMock.expectOne('/api/admin/production-sessions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      date: '2026-08-20',
      notes: null,
      rawMaterialUsages: [{ rawMaterialId: 1, quantityUsed: 3.5 }],
      participants: [{ userId: 'user-1', hoursSpent: 4 }],
      outputs: [{ productId: 1, quantityProduced: 80 }],
    });

    req.flush({
      id: 2,
      date: '2026-08-20',
      batchNumber: 'L20260820-01',
      notes: null,
      rawMaterialUsages: [{ rawMaterialId: 1, rawMaterialName: 'Farine', unit: 'kg', quantityUsed: 3.5 }],
      participants: [{ userId: 'user-1', userName: 'Cel Nino', hoursSpent: 4 }],
      outputs: [{ productId: 1, productName: 'Chicken', quantityProduced: 80 }],
    });

    // Creating a session increments stock, so the catalog is refreshed.
    httpMock.expectOne('/api/products').flush([]);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('2026-08-20');
    expect(fixture.nativeElement.textContent).toContain('L20260820-01');
  });

  it('shows a submit error message when creation fails', async () => {
    await flushInit([]);

    const dateInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '.admin-production-sessions__top-fields input[type="date"]',
    );
    dateInput.value = '2026-08-20';
    dateInput.dispatchEvent(new Event('input'));

    const lineSections = fixture.nativeElement.querySelectorAll('.admin-production-sessions__lines');

    (lineSections[0].querySelector('select') as HTMLSelectElement).value = '1';
    lineSections[0].querySelector('select')!.dispatchEvent(new Event('change'));
    (lineSections[0].querySelector('input[type="number"]') as HTMLInputElement).value = '1';
    lineSections[0].querySelector('input[type="number"]')!.dispatchEvent(new Event('input'));

    (lineSections[1].querySelector('select') as HTMLSelectElement).value = 'user-1';
    lineSections[1].querySelector('select')!.dispatchEvent(new Event('change'));
    (lineSections[1].querySelector('input[type="number"]') as HTMLInputElement).value = '1';
    lineSections[1].querySelector('input[type="number"]')!.dispatchEvent(new Event('input'));

    (lineSections[2].querySelector('select') as HTMLSelectElement).value = '1';
    lineSections[2].querySelector('select')!.dispatchEvent(new Event('change'));
    (lineSections[2].querySelector('input[type="number"]') as HTMLInputElement).value = '1';
    lineSections[2].querySelector('input[type="number"]')!.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    clickButton('Enregistrer la session');

    httpMock
      .expectOne('/api/admin/production-sessions')
      .flush({ message: 'Matière première introuvable : 1' }, { status: 404, statusText: 'Not Found' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Matière première introuvable : 1');
  });
});
