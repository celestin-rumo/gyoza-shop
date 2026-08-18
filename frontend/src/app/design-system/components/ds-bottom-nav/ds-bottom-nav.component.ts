import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DsNavLink } from '../ds-navbar/ds-navbar.component';

/**
 * <ds-bottom-nav [links]="navLinks"></ds-bottom-nav>
 *
 * Used for: the main navigation on mobile, fixed to the bottom of the screen (replaces
 * the header links, hidden below 640px). Only shows links that have an `icon`.
 */
@Component({
  selector: 'ds-bottom-nav',
  imports: [RouterLink],
  templateUrl: './ds-bottom-nav.component.html',
  styleUrl: './ds-bottom-nav.component.scss',
})
export class DsBottomNavComponent {
  links = input<DsNavLink[]>([]);
  linkClick = output<DsNavLink>();

  protected isRouterLink(href: string): boolean {
    return href.startsWith('/') && !href.includes('#');
  }
}
