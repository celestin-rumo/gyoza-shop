import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsNumberStepperComponent } from './ds-number-stepper.component';

describe('DsNumberStepperComponent', () => {
  let fixture: ComponentFixture<DsNumberStepperComponent>;

  function setInputs(overrides: {
    value?: number;
    step?: number;
    min?: number;
    label?: string;
    disabled?: boolean;
  }): void {
    fixture.componentRef.setInput('label', overrides.label ?? 'la quantité');
    if (overrides.value !== undefined) {
      fixture.componentRef.setInput('value', overrides.value);
    }
    if (overrides.step !== undefined) {
      fixture.componentRef.setInput('step', overrides.step);
    }
    if (overrides.min !== undefined) {
      fixture.componentRef.setInput('min', overrides.min);
    }
    if (overrides.disabled !== undefined) {
      fixture.componentRef.setInput('disabled', overrides.disabled);
    }
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.ds-number-stepper__input');
  }

  function incrementButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[aria-label="Augmenter la quantité"]');
  }

  function decrementButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[aria-label="Diminuer la quantité"]');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DsNumberStepperComponent] });
    fixture = TestBed.createComponent(DsNumberStepperComponent);
  });

  it('increments and decrements the value by the given step', () => {
    setInputs({ value: 1, step: 0.5 });

    incrementButton().click();
    fixture.detectChanges();
    expect(input().value).toBe('1.5');

    decrementButton().click();
    fixture.detectChanges();
    decrementButton().click();
    fixture.detectChanges();
    expect(input().value).toBe('0.5');
  });

  it('clamps to the configured minimum', () => {
    setInputs({ value: 0, step: 1, min: 0 });

    decrementButton().click();
    fixture.detectChanges();

    expect(input().value).toBe('0');
  });

  it('avoids floating-point drift after repeated increments', () => {
    setInputs({ value: 0, step: 0.1 });

    for (let i = 0; i < 3; i++) {
      incrementButton().click();
      fixture.detectChanges();
    }

    expect(input().value).toBe('0.3');
  });

  it('accepts direct typing into the input', () => {
    setInputs({ value: 0 });

    const el = input();
    el.value = '42';
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(el.value).toBe('42');
  });

  it('clamps typed values below the minimum', () => {
    setInputs({ value: 5, min: 2 });

    const el = input();
    el.value = '-3';
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(el.value).toBe('2');
  });

  it('builds the buttons and input accessible names from the label', () => {
    setInputs({ label: 'le prix payé' });

    expect(
      fixture.nativeElement.querySelector('button[aria-label="Diminuer le prix payé"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Augmenter le prix payé"]'),
    ).not.toBeNull();
    expect(input().getAttribute('aria-label')).toBe('le prix payé');
  });

  it('disables the buttons and input when disabled is set', () => {
    setInputs({ disabled: true });

    expect(incrementButton().disabled).toBe(true);
    expect(decrementButton().disabled).toBe(true);
    expect(input().disabled).toBe(true);
  });
});
