import { Component, input, output } from '@angular/core';

/**
 * <ds-option [selected]="value() === 'X'" (select)="choose('X')">Libellé</ds-option>
 *
 * A single selectable rectangle, meant to be repeated inside a
 * `role="radiogroup"` container. Used for: fulfillment method, pickup/delivery
 * slot, fresh/frozen content type — any click-to-select choice in the
 * checkout stepper (and reusable anywhere else a similar picker is needed).
 *
 * Disabled options stay focusable and keep their accessible name (via
 * `aria-disabled`, not the native `disabled` attribute) so assistive tech can
 * still reach and announce them — e.g. "Frais" when the order window is closed.
 */
@Component({
  selector: 'ds-option',
  templateUrl: './ds-option.component.html',
  styleUrl: './ds-option.component.scss',
})
export class DsOptionComponent {
  selected = input(false);
  disabled = input(false);

  select = output<void>();

  protected onClick(): void {
    if (this.disabled()) {
      return;
    }
    this.select.emit();
  }
}
