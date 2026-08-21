import { Component, computed, input } from '@angular/core';

export interface DsStep {
  id: string;
  label: string;
}

/**
 * <ds-stepper [steps]="steps" [currentIndex]="currentStepIndex()"></ds-stepper>
 *
 * Used for: the progress indicator of any multi-step wizard (currently checkout).
 * Purely presentational and display-only — it doesn't own navigation; the
 * consuming page renders its own "Retour"/"Continuer" controls wherever they
 * make sense for that step's layout (e.g. at the bottom of the step content).
 */
@Component({
  selector: 'ds-stepper',
  templateUrl: './ds-stepper.component.html',
  styleUrl: './ds-stepper.component.scss',
})
export class DsStepperComponent {
  steps = input.required<DsStep[]>();
  currentIndex = input.required<number>();

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
