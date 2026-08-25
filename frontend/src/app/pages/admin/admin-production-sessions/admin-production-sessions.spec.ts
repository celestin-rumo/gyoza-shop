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
    durationHours: 4,
    notes: 'Session du samedi',
    otherCosts: 0,
    rawMaterialUsages: [
      {
        rawMaterialId: 1,
        rawMaterialName: 'Farine',
        unit: 'kg',
        quantityUsed: 3.5,
        unitCost: 2.5,
        lineCost: 8.75,
        targetProductId: null,
        targetProductName: null,
      },
    ],
    participants: [{ userId: 'user-1', userName: 'Cel Nino' }],
    outputs: [
      {
        productId: 1,
        productName: 'Chicken',
        quantityProduced: 80,
        unitSalePrice: 2,
        revenue: 160,
        materialCost: 8.75,
        costPerGyoza: 0.11,
        unitsSold: 0,
        unitsRemaining: 80,
        actualRevenue: 0,
      },
    ],
    costSummary: {
      totalMaterialCost: 8.75,
      totalGyozaProduced: 80,
      materialCostPerGyoza: 0.11,
      totalSessionHours: 4,
      timePerGyoza: 0.05,
      theoreticalRevenue: 160,
      grossProfit: 151.25,
      otherCosts: 0,
      netProfit: 151.25,
      hourlyRevenue: 37.81,
      roi: 1728.57,
    },
    actualSummary: {
      unitsSold: 0,
      unitsRemaining: 80,
      actualRevenue: 0,
      actualGrossProfit: -8.75,
      actualNetProfit: -8.75,
      actualHourlyRevenue: -2.1875,
      actualRoi: -100,
    },
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

  function findButton(name: string): HTMLButtonElement {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const button = buttons.find((candidate) => candidate.textContent?.trim() === name);
    if (!button) {
      throw new Error(`No button found matching ${name}`);
    }
    return button;
  }

  function setInputValue(selector: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setSelectValue(selector: string, value: string): void {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector(selector);
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  /** Opens the wizard. The date step starts pre-filled with today's date, so it's valid already. */
  function openWizard(): void {
    clickButton('Enregistrer une nouvelle session');
    fixture.detectChanges();
  }

  function goToNextStep(): void {
    clickButton('Continuer');
    fixture.detectChanges();
  }

  /** Opens the wizard and advances past the (pre-filled) date step to the raw materials step. */
  function openWizardToRawMaterialsStep(): void {
    openWizard();
    goToNextStep();
  }

  /** Opens the wizard and fills the date/raw materials/participants steps to reach the outputs step. */
  function openWizardToOutputsStep(): void {
    openWizardToRawMaterialsStep();
    setSelectValue('select', '1');
    setInputValue('.ds-number-stepper__input', '1');
    goToNextStep();
    setSelectValue('select', 'user-1');
    goToNextStep();
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

  it('loads and displays the session history collapsed, with the output highlighted', async () => {
    await flushInit();

    // Scoped to the history card: the "new session" form above also renders a "Farine"
    // option and a "Chicken" option, which would otherwise give false positives/negatives.
    const cardText = (
      fixture.nativeElement.querySelector('.admin-production-session') as HTMLElement
    ).textContent;

    expect(cardText).toContain('L20260810-01');
    expect(cardText).toContain('2026-08-10');
    expect(cardText).toContain('Chicken');
    expect(cardText).toContain('+80');
    expect(cardText).toContain('4 h');
    // The hourly revenue is highlighted even while the card is collapsed.
    expect(cardText).toContain('Revenu horaire');
    expect(cardText).toContain('CHF 37.81/h');

    // Collapsed by default: only the batch/date/output/duration summary is visible.
    expect(cardText).not.toContain('Session du samedi');
    expect(cardText).not.toContain('Farine');
    expect(cardText).not.toContain('Cel Nino');
  });

  it('expands a session to reveal its raw materials, participants and notes', async () => {
    await flushInit();

    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.admin-production-session__toggle',
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Session du samedi');
    expect(text).toContain('Farine — 3.5 kg');
    expect(text).toContain('Cel Nino');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.textContent).not.toContain('Session du samedi');
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

  it('opens the wizard from the trigger button and shows the 5-step progress indicator', async () => {
    await flushInit();

    expect(fixture.nativeElement.querySelector('.admin-production-sessions__modal')).toBeNull();

    openWizard();

    expect(fixture.nativeElement.querySelector('.admin-production-sessions__modal')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Date et notes');
  });

  it('closes the wizard via the close button without submitting anything', async () => {
    await flushInit();
    openWizard();

    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Fermer"]',
    );
    closeButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.admin-production-sessions__modal')).toBeNull();
    httpMock.expectNone('/api/admin/production-sessions');
  });

  it('keeps the continue button disabled until the current step has a valid entry', async () => {
    await flushInit();

    // The date step starts pre-filled with today's date, so it advances immediately —
    // the raw materials step (empty by default) is where the gating is actually visible.
    openWizardToRawMaterialsStep();

    expect(findButton('Continuer').disabled).toBe(true);

    httpMock.expectNone('/api/admin/production-sessions');
  });

  it('adjusts the raw material quantity via the +/- stepper buttons', async () => {
    await flushInit();
    openWizardToRawMaterialsStep();

    const quantityInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '.ds-number-stepper__input',
    );
    expect(quantityInput.value).toBe('0');

    const increment: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Augmenter la quantité"]',
    );
    increment.click();
    fixture.detectChanges();
    expect(quantityInput.value).toBe('0.1');

    increment.click();
    fixture.detectChanges();
    expect(quantityInput.value).toBe('0.2');

    const decrement: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Diminuer la quantité"]',
    );
    decrement.click();
    fixture.detectChanges();
    expect(quantityInput.value).toBe('0.1');
  });

  it('does not let the raw material quantity go below zero', async () => {
    await flushInit();
    openWizardToRawMaterialsStep();

    const decrement: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Diminuer la quantité"]',
    );
    decrement.click();
    fixture.detectChanges();

    const quantityInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '.ds-number-stepper__input',
    );
    expect(quantityInput.value).toBe('0');
  });

  it('adjusts the produced quantity via the +/- stepper buttons', async () => {
    await flushInit();
    openWizardToOutputsStep();

    const quantityInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '.ds-number-stepper__input',
    );
    expect(quantityInput.value).toBe('0');

    const increment: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Augmenter la quantité produite"]',
    );
    increment.click();
    fixture.detectChanges();
    increment.click();
    fixture.detectChanges();
    expect(quantityInput.value).toBe('2');

    const decrement: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Diminuer la quantité produite"]',
    );
    decrement.click();
    fixture.detectChanges();
    expect(quantityInput.value).toBe('1');
  });

  it('does not let the produced quantity go below zero', async () => {
    await flushInit();
    openWizardToOutputsStep();

    const decrement: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Diminuer la quantité produite"]',
    );
    decrement.click();
    fixture.detectChanges();

    const quantityInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '.ds-number-stepper__input',
    );
    expect(quantityInput.value).toBe('0');
  });

  it('adds and removes raw material lines', async () => {
    await flushInit();
    openWizardToRawMaterialsStep();

    expect(fixture.nativeElement.querySelectorAll('.admin-production-sessions__line').length).toBe(1);

    clickButton('+ Ajouter une matière première');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.admin-production-sessions__line').length).toBe(2);

    clickButton('Retirer', 1);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.admin-production-sessions__line').length).toBe(1);
  });

  it('keeps the "+ Achat" button disabled until a raw material is selected for the line', async () => {
    await flushInit();
    openWizardToRawMaterialsStep();

    expect(findButton('+ Achat').disabled).toBe(true);

    setSelectValue('select', '1');

    expect(findButton('+ Achat').disabled).toBe(false);
  });

  it('toggles the inline purchase draft form open and closed', async () => {
    await flushInit();
    openWizardToRawMaterialsStep();
    setSelectValue('select', '1');

    clickButton('+ Achat');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Enregistrer l’achat correspondant');

    clickButton('Annuler l’achat');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Enregistrer l’achat correspondant');
  });

  it('logs a purchase for the raw material directly from the wizard, independently of the session', async () => {
    await flushInit();
    openWizardToRawMaterialsStep();
    setSelectValue('select', '1');

    clickButton('+ Achat');
    fixture.detectChanges();

    const draft: HTMLElement = fixture.nativeElement.querySelector(
      '.admin-production-sessions__purchase-draft',
    );

    const dateInput: HTMLInputElement = draft.querySelector('input[type="date"]')!;
    dateInput.value = '2026-08-20';
    dateInput.dispatchEvent(new Event('input'));

    const quantityInput: HTMLInputElement = draft.querySelector(
      'input[aria-label="la quantité achetée"]',
    )!;
    quantityInput.value = '5';
    quantityInput.dispatchEvent(new Event('input'));

    const priceInput: HTMLInputElement = draft.querySelector('input[aria-label="le prix payé"]')!;
    priceInput.value = '15';
    priceInput.dispatchEvent(new Event('input'));

    const textInputs: HTMLInputElement[] = Array.from(draft.querySelectorAll('input[type="text"]'));
    textInputs[0].value = 'Suisse';
    textInputs[0].dispatchEvent(new Event('input'));
    textInputs[1].value = 'Coop';
    textInputs[1].dispatchEvent(new Event('input'));

    fixture.detectChanges();

    clickButton('Enregistrer l’achat');

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
      id: 99,
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

    httpMock.expectOne('/api/admin/raw-materials').flush(rawMaterials);

    await fixture.whenStable();
    fixture.detectChanges();

    // The draft form closes on success; the wizard stays open on the same step, and
    // nothing was posted to the production-sessions endpoint.
    expect(fixture.nativeElement.textContent).not.toContain('Enregistrer l’achat correspondant');
    expect(fixture.nativeElement.querySelector('.admin-production-sessions__modal')).not.toBeNull();
    httpMock.expectNone('/api/admin/production-sessions');
  });

  it('adjusts the session duration via the +/- stepper buttons', async () => {
    await flushInit();
    openWizard();

    goToNextStep(); // date -> raw materials
    setSelectValue('select', '1');
    setInputValue('.ds-number-stepper__input', '1');
    goToNextStep(); // -> participants
    setSelectValue('select', 'user-1');
    goToNextStep(); // -> products
    setSelectValue('select', '1');
    setInputValue('input[type="number"]', '1');
    goToNextStep(); // -> duration

    const durationInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '.ds-number-stepper__input',
    );
    expect(durationInput.value).toBe('0');

    const increment: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Augmenter la durée"]',
    );
    increment.click();
    fixture.detectChanges();
    expect(durationInput.value).toBe('0.5');

    const decrement: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Diminuer la durée"]',
    );
    decrement.click();
    fixture.detectChanges();
    decrement.click();
    fixture.detectChanges();
    expect(durationInput.value).toBe('0');
  });

  it('submits a new session after walking through all 5 steps, and prepends it to the history', async () => {
    await flushInit([]);
    openWizard();

    // Step 1: date (overwrite the pre-filled default).
    setInputValue('input[type="date"]', '2026-08-20');
    goToNextStep();

    // Step 2: raw materials.
    setSelectValue('select', '1');
    setInputValue('.ds-number-stepper__input', '3.5');
    goToNextStep();

    // Step 3: participants (names only).
    setSelectValue('select', 'user-1');
    goToNextStep();

    // Step 4: products fabricated.
    setSelectValue('select', '1');
    setInputValue('input[type="number"]', '80');
    goToNextStep();

    // Step 5: session duration.
    setInputValue('.ds-number-stepper__input', '4');

    clickButton('Enregistrer');

    const req = httpMock.expectOne('/api/admin/production-sessions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      date: '2026-08-20',
      durationHours: 4,
      notes: null,
      otherCosts: 0,
      rawMaterialUsages: [{ rawMaterialId: 1, quantityUsed: 3.5, targetProductId: null }],
      participants: [{ userId: 'user-1' }],
      outputs: [{ productId: 1, quantityProduced: 80 }],
    });

    req.flush({
      id: 2,
      date: '2026-08-20',
      batchNumber: 'L20260820-01',
      durationHours: 4,
      notes: null,
      otherCosts: 0,
      rawMaterialUsages: [
        {
          rawMaterialId: 1,
          rawMaterialName: 'Farine',
          unit: 'kg',
          quantityUsed: 3.5,
          unitCost: 2.5,
          lineCost: 8.75,
          targetProductId: null,
          targetProductName: null,
        },
      ],
      participants: [{ userId: 'user-1', userName: 'Cel Nino' }],
      outputs: [
        {
          productId: 1,
          productName: 'Chicken',
          quantityProduced: 80,
          unitSalePrice: 2,
          revenue: 160,
          materialCost: 8.75,
          costPerGyoza: 0.11,
          unitsSold: 0,
          unitsRemaining: 80,
          actualRevenue: 0,
        },
      ],
      costSummary: {
        totalMaterialCost: 8.75,
        totalGyozaProduced: 80,
        materialCostPerGyoza: 0.11,
        totalSessionHours: 4,
        timePerGyoza: 0.05,
        theoreticalRevenue: 160,
        grossProfit: 151.25,
        otherCosts: 0,
        netProfit: 151.25,
        hourlyRevenue: 37.81,
        roi: 1728.57,
      },
      actualSummary: {
        unitsSold: 0,
        unitsRemaining: 80,
        actualRevenue: 0,
        actualGrossProfit: -8.75,
        actualNetProfit: -8.75,
        actualHourlyRevenue: -2.1875,
        actualRoi: -100,
      },
    });

    // Creating a session increments stock, so the catalog is refreshed.
    httpMock.expectOne('/api/products').flush([]);

    await fixture.whenStable();
    fixture.detectChanges();

    // The wizard closes on success.
    expect(fixture.nativeElement.querySelector('.admin-production-sessions__modal')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('2026-08-20');
    expect(fixture.nativeElement.textContent).toContain('L20260820-01');
  });

  it('shows a submit error message when creation fails, and keeps the wizard open', async () => {
    await flushInit([]);
    openWizard();

    setInputValue('input[type="date"]', '2026-08-20');
    goToNextStep();

    setSelectValue('select', '1');
    setInputValue('.ds-number-stepper__input', '1');
    goToNextStep();

    setSelectValue('select', 'user-1');
    goToNextStep();

    setSelectValue('select', '1');
    setInputValue('input[type="number"]', '1');
    goToNextStep();

    setInputValue('.ds-number-stepper__input', '1');

    clickButton('Enregistrer');

    httpMock
      .expectOne('/api/admin/production-sessions')
      .flush({ message: 'Matière première introuvable : 1' }, { status: 404, statusText: 'Not Found' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.admin-production-sessions__modal')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Matière première introuvable : 1');
  });

  it('tags a raw material usage with a target flavor, included in the submitted payload', async () => {
    await flushInit([]);
    openWizard();

    setInputValue('input[type="date"]', '2026-08-20');
    goToNextStep();

    const selects: HTMLSelectElement[] = Array.from(fixture.nativeElement.querySelectorAll('select'));
    setSelectValue('select', '1'); // raw material
    setInputValue('.ds-number-stepper__input', '3.5');
    selects[1].value = '1'; // target product ("Chicken")
    selects[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    goToNextStep();

    setSelectValue('select', 'user-1');
    goToNextStep();

    setSelectValue('select', '1');
    setInputValue('input[type="number"]', '80');
    goToNextStep();

    setInputValue('.ds-number-stepper__input', '4');
    clickButton('Enregistrer');

    const req = httpMock.expectOne('/api/admin/production-sessions');
    expect(req.request.body.rawMaterialUsages).toEqual([
      { rawMaterialId: 1, quantityUsed: 3.5, targetProductId: 1 },
    ]);

    req.flush({
      ...existingSession,
      id: 2,
      date: '2026-08-20',
      batchNumber: 'L20260820-01',
      rawMaterialUsages: [
        {
          rawMaterialId: 1,
          rawMaterialName: 'Farine',
          unit: 'kg',
          quantityUsed: 3.5,
          unitCost: 2.5,
          lineCost: 8.75,
          targetProductId: 1,
          targetProductName: 'Chicken',
        },
      ],
    });

    httpMock.expectOne('/api/products').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('edits the other costs of an existing session via the inline control', async () => {
    await flushInit();

    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.admin-production-session__toggle',
    );
    toggle.click();
    fixture.detectChanges();

    clickButton('Modifier');
    fixture.detectChanges();

    const increment: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Augmenter les autres charges"]',
    );
    increment.click();
    fixture.detectChanges();

    clickButton('Enregistrer');

    const req = httpMock.expectOne('/api/admin/production-sessions/1/other-costs');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ otherCosts: 1 });

    req.flush({ ...existingSession, otherCosts: 1 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Autres charges : CHF 1.00');
  });
});
