import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { CartService } from './services/cart.service';
import {
  DsBottomNavComponent,
  DsCartAddEvent,
  DsCartFabComponent,
  DsCartPanelComponent,
  DsCartQuantityChangeEvent,
  DsFooterComponent,
  DsNavbarComponent,
  DsNavLink,
} from './design-system';

const NAV_LINKS: Omit<DsNavLink, 'active'>[] = [
  { label: 'Accueil', href: '/', icon: 'home' },
  { label: 'Nos gyozas', href: '/nos-gyozas', icon: 'gyozas' },
  { label: 'À propos', href: '/a-propos', icon: 'about' },
  { label: 'Contact', href: '/contact', icon: 'contact' },
];

/**
 * Coquille de l'application : header, panier (panneau, bouton flottant mobile, nav du bas)
 * et footer, communs à toutes les pages, entourant le `<router-outlet>`.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    DsNavbarComponent,
    DsCartPanelComponent,
    DsCartFabComponent,
    DsBottomNavComponent,
    DsFooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  protected readonly cart = inject(CartService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly navLinks = computed<DsNavLink[]>(() =>
    NAV_LINKS.map((link) => ({ ...link, active: this.currentUrl() === link.href })),
  );

  protected onCartQuantityChange(event: DsCartQuantityChangeEvent): void {
    this.cart.setQuantity(event.line.product.id, event.line.pack.id, event.quantity);
  }

  protected onCartLineRemove(line: DsCartAddEvent): void {
    this.cart.remove(line.product.id, line.pack.id);
  }

  protected onConfirmOrder(): void {
    this.cart.close();
    this.router.navigateByUrl('/checkout');
  }

  protected onAccountClick(): void {
    this.router.navigateByUrl('/admin/login');
  }
}
