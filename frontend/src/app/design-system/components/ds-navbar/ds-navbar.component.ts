import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DsButtonComponent } from '../ds-button/ds-button.component';

export type DsNavLinkIcon = 'home' | 'gyozas' | 'about' | 'contact';

export interface DsNavLink {
  label: string;
  href: string;
  active?: boolean;
  /** Icon used by the mobile navigation at the bottom of the screen (ds-bottom-nav). */
  icon?: DsNavLinkIcon;
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
 * Used for: the header, identical across every page of the site.
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

  /** A link is a real Angular route if it points to a path, without a `#...` anchor. */
  isRouterLink(href: string): boolean {
    return href.startsWith('/') && !href.includes('#');
  }
}
