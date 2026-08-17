import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DsButtonComponent } from '../ds-button/ds-button.component';

export interface DsNavLink {
  label: string;
  href: string;
  active?: boolean;
}

/**
 * <ds-navbar
 *   brand="GYOZA"
 *   brandSuffix="MAISON"
 *   [links]="navLinks"
 *   [cartCount]="cartCount"
 *   (cartClick)="openCart()"
 *   (accountClick)="openAccount()"
 * ></ds-navbar>
 *
 * Utilisé pour : le header, identique sur toutes les pages du site.
 */
@Component({
  selector: 'ds-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, DsButtonComponent],
  templateUrl: './ds-navbar.component.html',
  styleUrls: ['./ds-navbar.component.scss'],
})
export class DsNavbarComponent {
  @Input() brand = 'GYOZA';
  @Input() brandSuffix = 'MAISON';
  @Input() links: DsNavLink[] = [];
  @Input() cartCount = 0;

  @Output() cartClick = new EventEmitter<void>();
  @Output() accountClick = new EventEmitter<void>();
  @Output() linkClick = new EventEmitter<DsNavLink>();

  /** Un lien est une vraie route Angular s'il pointe vers un chemin, sans ancre `#...`. */
  isRouterLink(href: string): boolean {
    return href.startsWith('/') && !href.includes('#');
  }
}
