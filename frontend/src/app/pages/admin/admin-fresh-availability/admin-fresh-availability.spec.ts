import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminFreshAvailability } from './admin-fresh-availability';

describe('AdminFreshAvailability', () => {
  let fixture: ComponentFixture<AdminFreshAvailability>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminFreshAvailability],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminFreshAvailability);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('loads and displays the current availability', async () => {
    httpMock
      .expectOne('/api/fresh-availability')
      .flush({ nextBatchDate: '2026-09-15', orderWindowOpen: true });

    await fixture.whenStable();
    fixture.detectChanges();

    const dateInput: HTMLInputElement = fixture.nativeElement.querySelector('#nextBatchDate');
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');

    expect(dateInput.value).toBe('2026-09-15');
    expect(checkbox.checked).toBe(true);
  });

  it('shows an error message when loading fails', async () => {
    httpMock.expectOne('/api/fresh-availability').flush('error', { status: 500, statusText: 'Server Error' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger');
  });

  it('submits the updated availability', async () => {
    httpMock
      .expectOne('/api/fresh-availability')
      .flush({ nextBatchDate: '2026-09-15', orderWindowOpen: false });

    await fixture.whenStable();
    fixture.detectChanges();

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const req = httpMock.expectOne('/api/admin/fresh-availability');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nextBatchDate: '2026-09-15', orderWindowOpen: true });

    req.flush({ nextBatchDate: '2026-09-15', orderWindowOpen: true });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Disponibilité mise à jour.');
  });
});
