import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsStepperComponent, DsStep } from './ds-stepper.component';

describe('DsStepperComponent', () => {
  let fixture: ComponentFixture<DsStepperComponent>;

  const steps: DsStep[] = [
    { id: 'panier', label: 'Panier' },
    { id: 'recuperation', label: 'Récupération' },
    { id: 'coordonnees', label: 'Coordonnées' },
    { id: 'paiement', label: 'Paiement' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DsStepperComponent] });
    fixture = TestBed.createComponent(DsStepperComponent);
  });

  function setInputs(currentIndex: number): void {
    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('currentIndex', currentIndex);
    fixture.detectChanges();
  }

  it('marks only the current step with aria-current="step"', () => {
    setInputs(1);

    const items: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.ds-stepper__item'));
    const current = items.filter((item) => item.getAttribute('aria-current') === 'step');

    expect(current).toHaveLength(1);
    expect(current[0].textContent).toContain('Récupération');
  });

  it('marks earlier steps as done', () => {
    setInputs(2);

    const items: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.ds-stepper__item'));
    expect(items[0].classList).toContain('ds-stepper__item--done');
    expect(items[1].classList).toContain('ds-stepper__item--done');
    expect(items[2].classList).toContain('ds-stepper__item--current');
    expect(items[3].classList).toContain('ds-stepper__item--upcoming');
  });

  it('announces the current step in the aria-live region', () => {
    setInputs(0);

    const live: HTMLElement = fixture.nativeElement.querySelector('.ds-stepper__live');
    expect(live.textContent).toContain('Étape 1 sur 4 : Panier');
  });
});
