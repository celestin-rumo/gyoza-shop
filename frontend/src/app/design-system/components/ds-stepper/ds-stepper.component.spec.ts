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

  function setInputs(overrides: Partial<{ currentIndex: number; canGoNext: boolean; nextLabel: string }>): void {
    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('currentIndex', overrides.currentIndex ?? 0);
    if (overrides.canGoNext !== undefined) {
      fixture.componentRef.setInput('canGoNext', overrides.canGoNext);
    }
    if (overrides.nextLabel !== undefined) {
      fixture.componentRef.setInput('nextLabel', overrides.nextLabel);
    }
    fixture.detectChanges();
  }

  it('marks only the current step with aria-current="step"', () => {
    setInputs({ currentIndex: 1 });

    const items: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.ds-stepper__item'));
    const current = items.filter((item) => item.getAttribute('aria-current') === 'step');

    expect(current).toHaveLength(1);
    expect(current[0].textContent).toContain('Récupération');
  });

  it('hides the "Retour" button on the first step', () => {
    setInputs({ currentIndex: 0 });

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons.some((button) => button.textContent?.trim() === 'Retour')).toBe(false);
  });

  it('shows the "Retour" button after the first step', () => {
    setInputs({ currentIndex: 1 });

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons.some((button) => button.textContent?.trim() === 'Retour')).toBe(true);
  });

  it('uses the provided nextLabel for the next-step button', () => {
    setInputs({ currentIndex: 2, nextLabel: 'Payer' });

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons.some((button) => button.textContent?.trim() === 'Payer')).toBe(true);
  });

  it('emits next and back when the corresponding buttons are pressed', () => {
    setInputs({ currentIndex: 1 });

    const nextSpy = vi.fn();
    const backSpy = vi.fn();
    fixture.componentInstance.next.subscribe(nextSpy);
    fixture.componentInstance.back.subscribe(backSpy);

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    buttons.find((button) => button.textContent?.trim() === 'Retour')?.click();
    buttons.find((button) => button.textContent?.trim() === 'Continuer')?.click();

    expect(backSpy).toHaveBeenCalled();
    expect(nextSpy).toHaveBeenCalled();
  });

  it('disables the next button when canGoNext is false', () => {
    setInputs({ currentIndex: 1, canGoNext: false });

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const nextButton = buttons.find((button) => button.textContent?.trim() === 'Continuer');

    expect(nextButton?.disabled).toBe(true);
  });
});
