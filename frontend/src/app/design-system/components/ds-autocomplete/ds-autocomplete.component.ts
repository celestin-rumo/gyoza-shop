import { Component, computed, input, signal } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

export interface DsAutocompleteOption {
  label: string;
  value: string;
}

/**
 * <ds-autocomplete label="Ajouter un admin par email" fieldId="email" [options]="userOptions()" [field]="addAdminForm.email"></ds-autocomplete>
 *
 * Text input wired to a Signal Forms field, with a type-to-filter dropdown of
 * matching options below it. Typing any letter narrows `options` by label or
 * value (case-insensitive substring match); picking one sets the field value.
 * Follows the ARIA 1.2 combobox pattern (listbox popup, activedescendant).
 *
 * Used for: admin rights management user lookup — searching an admin/customer
 * account by name or email instead of requiring the exact email to be typed.
 */
@Component({
  selector: 'ds-autocomplete',
  imports: [FormField],
  templateUrl: './ds-autocomplete.component.html',
  styleUrl: './ds-autocomplete.component.scss',
})
export class DsAutocompleteComponent {
  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly field = input.required<Field<string>>();
  readonly options = input<DsAutocompleteOption[]>([]);
  readonly placeholder = input<string | null>(null);
  readonly noResultsLabel = input('Aucun résultat.');

  protected readonly state = computed(() => this.field()());
  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(-1);

  protected readonly filteredOptions = computed(() => {
    const query = this.state().value().trim().toLowerCase();
    if (!query) {
      return this.options();
    }

    return this.options().filter(
      (option) =>
        option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query),
    );
  });

  protected onFocus(): void {
    this.isOpen.set(true);
  }

  protected onBlur(): void {
    // Closing on blur would beat a mousedown-selected option to the punch, but
    // that path already prevents the blur; this is only a fallback for e.g.
    // tapping outside the control on touch devices.
    this.isOpen.set(false);
    this.activeIndex.set(-1);
  }

  protected select(option: DsAutocompleteOption): void {
    this.state().value.set(option.value);
    this.isOpen.set(false);
    this.activeIndex.set(-1);
  }

  protected onOptionMousedown(event: MouseEvent, option: DsAutocompleteOption): void {
    event.preventDefault();
    this.select(option);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const options = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        if (options.length === 0) return;
        event.preventDefault();
        this.isOpen.set(true);
        this.activeIndex.update((index) => (index + 1) % options.length);
        break;
      case 'ArrowUp':
        if (options.length === 0) return;
        event.preventDefault();
        this.isOpen.set(true);
        this.activeIndex.update((index) => (index - 1 + options.length) % options.length);
        break;
      case 'Enter': {
        const active = this.activeIndex();
        if (this.isOpen() && active >= 0 && active < options.length) {
          event.preventDefault();
          this.select(options[active]);
        }
        break;
      }
      case 'Escape':
        this.isOpen.set(false);
        this.activeIndex.set(-1);
        break;
    }
  }

  protected optionId(index: number): string {
    return `${this.fieldId()}-option-${index}`;
  }
}
