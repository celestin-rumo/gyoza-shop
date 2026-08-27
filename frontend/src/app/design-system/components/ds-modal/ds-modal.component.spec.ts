import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsModalComponent } from './ds-modal.component';

@Component({
  imports: [DsModalComponent],
  template: `
    <ds-modal title="Exporter les données" (closed)="closedCount = closedCount + 1">
      <p class="body-content">Contenu</p>
      <div modal-footer>
        <button type="button">Valider</button>
      </div>
    </ds-modal>
  `,
})
class HostComponent {
  closedCount = 0;
}

describe('DsModalComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  function backdrop(): HTMLElement {
    return fixture.nativeElement.querySelector('.ds-modal__backdrop');
  }

  function panel(): HTMLElement {
    return fixture.nativeElement.querySelector('.ds-modal__panel');
  }

  function closeButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.ds-modal__close');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders the title and projects the body/footer content', () => {
    expect(panel().querySelector('.ds-modal__title')?.textContent?.trim()).toBe('Exporter les données');
    expect(fixture.nativeElement.querySelector('.body-content')?.textContent?.trim()).toBe('Contenu');
    expect(fixture.nativeElement.querySelector('[modal-footer] button')?.textContent?.trim()).toBe('Valider');
  });

  it('moves focus into the panel on open', () => {
    expect(document.activeElement).toBe(panel());
  });

  it('emits closed when the close button is clicked', () => {
    closeButton().click();
    fixture.detectChanges();

    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('emits closed when the backdrop is clicked', () => {
    backdrop().click();
    fixture.detectChanges();

    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('emits closed when Escape is pressed', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.closedCount).toBe(1);
  });
});
