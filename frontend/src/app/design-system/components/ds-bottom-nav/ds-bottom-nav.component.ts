import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DsNavLink } from '../ds-navbar/ds-navbar.component';

/**
 * <ds-bottom-nav [links]="navLinks"></ds-bottom-nav>
 *
 * Utilisé pour : la navigation principale sur mobile, fixée en bas de l'écran (remplace
 * les liens du header, cachés sous 640px). N'affiche que les liens qui ont une `icon`.
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
