import { Component, input, model } from '@angular/core';

/**
 * <ds-number-stepper [(value)]="quantity" [step]="0.1" [min]="0" label="la quantité"></ds-number-stepper>
 *
 * A number input flanked by "−"/"+" buttons, with the browser's native spinner
 * arrows hidden. `label` names what's being adjusted (e.g. "la quantité", "la
 * durée") and is used to build the buttons' accessible names ("Diminuer la
 * quantité" / "Augmenter la quantité") and the input's own aria-label.
 *
 * Used for: any quantity/duration/price entry with quick +/- adjustment —
 * production session line items, raw material purchase quantity and price.
 */
@Component({
  selector: 'ds-number-stepper',
  templateUrl: './ds-number-stepper.component.html',
  styleUrl: './ds-number-stepper.component.scss',
})
export class DsNumberStepperComponent {
  value = model(0);
  step = input(1);
  min = input(0);
  label = input.required<string>();
  placeholder = input<string | null>(null);
  disabled = input(false);

  protected increment(): void {
    this.setValue(this.value() + this.step());
  }

  protected decrement(): void {
    this.setValue(this.value() - this.step());
  }

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).valueAsNumber;
    this.setValue(Number.isFinite(raw) ? raw : 0);
  }

  private setValue(next: number): void {
    const clamped = Math.max(this.min(), next);

    // Avoid floating-point drift (e.g. 0.1 + 0.2) from repeated clicks.
    this.value.set(Math.round(clamped * 1e6) / 1e6);
  }
}
