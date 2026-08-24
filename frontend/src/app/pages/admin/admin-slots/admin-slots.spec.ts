import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EventDropArg } from '@fullcalendar/core';

import { AdminSlots } from './admin-slots';
import { SlotAvailability } from '../../../models/slot-availability.model';

describe('AdminSlots', () => {
  let fixture: ComponentFixture<AdminSlots>;
  let httpMock: HttpTestingController;

  const existingSlot: SlotAvailability = {
    id: 1,
    date: '2027-01-05',
    fulfillmentMethod: 'PICKUP',
    startTime: '10:00:00',
    endTime: '12:00:00',
    contentType: 'FROZEN',
    open: true,
  };

  async function flushLoad(slots: SlotAvailability[] = [existingSlot]): Promise<void> {
    httpMock.expectOne('/api/admin/slots').flush(slots);
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminSlots],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminSlots);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('loads and displays existing slots', async () => {
    await flushLoad();

    expect(fixture.nativeElement.textContent).toContain('10h00–12h00');
    expect(fixture.nativeElement.textContent).toContain('2027-01-05');
    expect(fixture.nativeElement.textContent).toContain('Surgelé');
  });

  it('shows an error message when loading fails', async () => {
    httpMock.expectOne('/api/admin/slots').flush('error', { status: 500, statusText: 'Server Error' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger');
  });

  it('does not show required-field errors until the user attempts to submit', async () => {
    await flushLoad([]);

    const dateInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotDate');
    const startTimeInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotStartTime');
    const endTimeInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotEndTime');

    // Blurring the empty fields must not reveal any error yet.
    dateInput.dispatchEvent(new Event('blur'));
    startTimeInput.dispatchEvent(new Event('blur'));
    endTimeInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('La date est requise.');
    expect(fixture.nativeElement.textContent).not.toContain('L’heure de début est requise.');
    expect(fixture.nativeElement.textContent).not.toContain('L’heure de fin est requise.');

    // Only pressing "Créer le créneau" with the fields still empty should reveal them.
    clickButton('Créer le créneau');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La date est requise.');
    expect(fixture.nativeElement.textContent).toContain('L’heure de début est requise.');
    expect(fixture.nativeElement.textContent).toContain('L’heure de fin est requise.');

    httpMock.expectNone('/api/admin/slots');
  });

  it('creates a new slot from the single form', async () => {
    await flushLoad([]);

    const dateInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotDate');
    dateInput.value = '2027-03-01';
    dateInput.dispatchEvent(new Event('input'));

    clickButton('Retrait');

    const startTimeInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotStartTime');
    startTimeInput.value = '16:00';
    startTimeInput.dispatchEvent(new Event('input'));

    const endTimeInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotEndTime');
    endTimeInput.value = '18:00';
    endTimeInput.dispatchEvent(new Event('input'));

    clickButton('Surgelé');

    fixture.detectChanges();

    const forms: HTMLFormElement[] = Array.from(fixture.nativeElement.querySelectorAll('form'));
    forms[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const req = httpMock.expectOne('/api/admin/slots');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      date: '2027-03-01',
      fulfillmentMethod: 'PICKUP',
      startTime: '16:00',
      endTime: '18:00',
      contentType: 'FROZEN',
    });

    req.flush({
      id: 2,
      date: '2027-03-01',
      fulfillmentMethod: 'PICKUP',
      startTime: '16:00:00',
      endTime: '18:00:00',
      contentType: 'FROZEN',
      open: true,
    });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('16h00–18h00');
  });

  it('toggles an existing slot open/closed', async () => {
    await flushLoad();

    clickButton('Fermer');

    const req = httpMock.expectOne('/api/admin/slots/1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ open: false });

    req.flush({ ...existingSlot, open: false });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Fermé');
  });

  it('edits an existing slot and saves it via PUT', async () => {
    await flushLoad();

    clickButton('Modifier');
    fixture.detectChanges();

    const dateInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotDate');
    const startTimeInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotStartTime');
    const endTimeInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotEndTime');

    // Fields are prefilled from the existing slot (seconds truncated for the native time input).
    expect(dateInput.value).toBe('2027-01-05');
    expect(startTimeInput.value).toBe('10:00');
    expect(endTimeInput.value).toBe('12:00');

    startTimeInput.value = '14:00';
    startTimeInput.dispatchEvent(new Event('input'));
    endTimeInput.value = '16:00';
    endTimeInput.dispatchEvent(new Event('input'));
    clickButton('Livraison');
    fixture.detectChanges();

    const forms: HTMLFormElement[] = Array.from(fixture.nativeElement.querySelectorAll('form'));
    forms[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const req = httpMock.expectOne('/api/admin/slots/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      date: '2027-01-05',
      fulfillmentMethod: 'DELIVERY',
      startTime: '14:00',
      endTime: '16:00',
      contentType: 'FROZEN',
    });

    req.flush({
      id: 1,
      date: '2027-01-05',
      fulfillmentMethod: 'DELIVERY',
      startTime: '14:00:00',
      endTime: '16:00:00',
      contentType: 'FROZEN',
      open: true,
    });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('14h00–16h00');
    expect(fixture.nativeElement.textContent).toContain('Nouveau créneau');
  });

  it('cancels an in-progress edit without submitting anything', async () => {
    await flushLoad();

    clickButton('Modifier');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Modifier le créneau');

    clickButton('Annuler');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nouveau créneau');

    const dateInput: HTMLInputElement = fixture.nativeElement.querySelector('#slotDate');
    expect(dateInput.value).toBe('');

    httpMock.expectNone('/api/admin/slots/1');
  });

  it('deletes a slot after confirmation', async () => {
    await flushLoad();

    const confirmSpy = vi.fn().mockReturnValue(true);
    window.confirm = confirmSpy;

    clickButton('Supprimer');

    expect(confirmSpy).toHaveBeenCalled();

    const req = httpMock.expectOne('/api/admin/slots/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucun créneau créé');
  });

  it('does not delete a slot when the confirmation is declined', async () => {
    await flushLoad();

    window.confirm = vi.fn().mockReturnValue(false);

    clickButton('Supprimer');

    httpMock.expectNone('/api/admin/slots/1');
  });

  it('moves a slot to a new date when it is dragged in the calendar', async () => {
    await flushLoad();

    const component = fixture.componentInstance;
    const eventDrop = component['calendarOptions']().eventDrop as (arg: EventDropArg) => void;

    eventDrop({
      event: { id: 'slot-1', startStr: '2027-01-12' },
      revert: () => {
        throw new Error('should not revert on success');
      },
    } as unknown as EventDropArg);

    const req = httpMock.expectOne('/api/admin/slots/1/date');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ date: '2027-01-12' });

    req.flush({ ...existingSlot, date: '2027-01-12' });

    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('reverts the drag when the server rejects the move', async () => {
    await flushLoad();

    const component = fixture.componentInstance;
    const eventDrop = component['calendarOptions']().eventDrop as (arg: EventDropArg) => void;

    let reverted = false;
    eventDrop({
      event: { id: 'slot-1', startStr: '2027-01-12' },
      revert: () => (reverted = true),
    } as unknown as EventDropArg);

    const req = httpMock.expectOne('/api/admin/slots/1/date');
    req.flush({ message: 'Ce créneau existe déjà.' }, { status: 409, statusText: 'Conflict' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(reverted).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Ce créneau existe déjà.');
  });
});
