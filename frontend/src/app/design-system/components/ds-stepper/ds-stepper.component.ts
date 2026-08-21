import { Component, computed, input, output } from '@angular/core';
import { DsButtonComponent } from '../ds-button/ds-button.component';

export interface DsStep {
  id: string;
  label: string;
}

/**
 * <ds-stepper [steps]="steps" [currentIndex]="currentStepIndex()" [canGoNext]="canAdvance()"
 *             (back)="onBack()" (next)="onNext()"></ds-stepper>
 *
 * Used for: any multi-step wizard (currently checkout). Purely presentational —
 * it knows nothing about form validity or step content, the consuming page owns
 * that and decides whether `next` is allowed to advance via `canGoNext`.
 */
@Component({
  selector: 'ds-stepper',
  imports: [DsButtonComponent],
  templateUrl: './ds-stepper.component.html',
  styleUrl: './ds-stepper.component.scss',
})
export class DsStepperComponent {
  steps = input.required<DsStep[]>();
  currentIndex = input.required<number>();
  canGoNext = input(true);
  /** Label for the "next" action — the consuming page decides when this reads "Payer" vs "Continuer". */
  nextLabel = input('Continuer');

  back = output<void>();
  next = output<void>();

  protected readonly liveMessage = computed(() => {
    const steps = this.steps();
    const index = this.currentIndex();
    const step = steps[index];

    return step ? `Étape ${index + 1} sur ${steps.length} : ${step.label}` : '';
  });

  protected stepState(index: number): 'done' | 'current' | 'upcoming' {
    if (index < this.currentIndex()) {
      return 'done';
    }

    return index === this.currentIndex() ? 'current' : 'upcoming';
  }
}
