import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsIconButtonVariant = 'accent' | 'sage' | 'outline' | 'ghost';
export type DsIconButtonSize = 'sm' | 'md' | 'lg';

/**
 * <ds-icon-button variant="accent" ariaLabel="Ajouter au panier">
 *   <svg dsIcon>...</svg>
 * </ds-icon-button>
 *
 * Utilisé pour : le "+" rond sur chaque carte produit, l'icône compte,
 * ou tout bouton circulaire d'action.
 */
@Component({
  selector: 'ds-icon-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ds-icon-button.component.html',
  styleUrls: ['./ds-icon-button.component.scss'],
})
export class DsIconButtonComponent {
  @Input() variant: DsIconButtonVariant = 'accent';
  @Input() size: DsIconButtonSize = 'md';
  @Input() ariaLabel = '';
  @Input() disabled = false;

  @Output() pressed = new EventEmitter<MouseEvent>();

  @HostBinding('class') get hostClass(): string {
    return '';
  }

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      return;
    }
    this.pressed.emit(event);
  }
}
