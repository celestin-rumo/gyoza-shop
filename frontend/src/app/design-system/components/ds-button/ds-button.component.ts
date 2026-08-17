import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsButtonVariant = 'primary' | 'outline' | 'ghost' | 'sage';
export type DsButtonSize = 'sm' | 'md' | 'lg';

/**
 * <ds-button variant="primary" size="md">Commander</ds-button>
 * <ds-button variant="outline">Découvrir nos gyozas</ds-button>
 *
 * Utilisé pour : CTA hero ("Commander"), CTA secondaire ("Découvrir nos gyozas"),
 * bouton panier du header ("Panier (0)"), etc.
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
  /** Icône optionnelle affichée avant le texte (ex: badge panier) */
  @Input() fullWidth = false;

  @Output() pressed = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      return;
    }
    this.pressed.emit(event);
  }
}
