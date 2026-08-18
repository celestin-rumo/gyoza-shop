import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsButtonVariant = 'primary' | 'outline' | 'ghost' | 'sage';
export type DsButtonSize = 'sm' | 'md' | 'lg';

/**
 * <ds-button variant="primary" size="md">Order now</ds-button>
 * <ds-button variant="outline">Discover our gyozas</ds-button>
 *
 * Used for: hero CTA ("Order now"), secondary CTA ("Discover our gyozas"),
 * header cart button ("Cart (0)"), etc.
 */
@Component({
  selector: 'ds-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ds-button.component.html',
  styleUrls: ['./ds-button.component.scss'],
})
export class DsButtonComponent {
  @Input() variant: DsButtonVariant = 'primary';
  @Input() size: DsButtonSize = 'md';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  /** Optional icon displayed before the text (e.g. cart badge) */
  @Input() fullWidth = false;

  @Output() pressed = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      return;
    }
    this.pressed.emit(event);
  }
}
