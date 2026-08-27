import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, FormRoot } from '@angular/forms/signals';

import { DsAutocompleteComponent, DsAutocompleteOption } from './ds-autocomplete.component';

@Component({
  imports: [DsAutocompleteComponent, FormRoot],
  template: `
    <form [formRoot]="testForm">
      <ds-autocomplete
        label="Ajouter un admin par email"
        fieldId="email"
        [options]="options"
        [field]="testForm.email"
      ></ds-autocomplete>
    </form>
  `,
})
class HostComponent {
  readonly fields = signal({ email: '' });
  readonly testForm = form(this.fields, () => {});
  readonly options: DsAutocompleteOption[] = [
    { label: 'Jean Dupont — jean@example.com', value: 'jean@example.com' },
    { label: 'Jeanne Martin — jeanne@example.com', value: 'jeanne@example.com' },
    { label: 'Paul Petit — paul@example.com', value: 'paul@example.com' },
  ];
}

describe('DsAutocompleteComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.ds-autocomplete__input');
  }

  function options(): HTMLLIElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.ds-autocomplete__option'));
  }

  function typeInto(el: HTMLInputElement, value: string): void {
    el.value = value;
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('shows every option once focused with an empty query', () => {
    input().dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(options().length).toBe(3);
  });

  it('filters options by label or value as the user types a letter', () => {
    input().dispatchEvent(new Event('focus'));
    typeInto(input(), 'jean');

    const labels = options().map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Jean Dupont — jean@example.com', 'Jeanne Martin — jeanne@example.com']);
  });

  it('shows a "no results" message when nothing matches', () => {
    input().dispatchEvent(new Event('focus'));
    typeInto(input(), 'zzz');

    expect(options().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.ds-autocomplete__empty')).not.toBeNull();
  });

  it('fills the field value when an option is selected', () => {
    input().dispatchEvent(new Event('focus'));
    typeInto(input(), 'paul');

    const [option] = options();
    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(input().value).toBe('paul@example.com');
  });

  it('navigates with the keyboard and selects the active option on Enter', () => {
    input().dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(input().value).toBe('jean@example.com');
  });

  it('closes the listbox on Escape', () => {
    input().dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(options().length).toBe(3);

    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(options().length).toBe(0);
  });
});
