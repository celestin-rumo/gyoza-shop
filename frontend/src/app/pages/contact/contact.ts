import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../cart.service';
import {
  DsCartAddEvent,
  DsCartPanelComponent,
  DsCartQuantityChangeEvent,
  DsFooterComponent,
  DsNavbarComponent,
  DsNavLink,
  DsSectionHeaderComponent,
} from '../../design-system';

@Component({
  selector: 'app-contact',
  imports: [DsNavbarComponent, DsSectionHeaderComponent, DsCartPanelComponent, DsFooterComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  private readonly router = inject(Router);
  protected readonly cart = inject(CartService);
  protected readonly cartOpen = signal(false);

  protected readonly navLinks: DsNavLink[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Nos gyozas', href: '/nos-gyozas' },
    { label: 'À propos', href: '/a-propos' },
    { label: 'Contact', href: '/contact', active: true },
  ];

  protected readonly address = 'Chemin de la Pudressa 35, 1731 Ependes';
  protected readonly email = 'admin@celestinrumo.ch';
  protected readonly phone = '+41 76 433 28 94';

  protected readonly mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.address)}`;
  protected readonly mailHref = `mailto:${this.email}`;
  protected readonly telHref = `tel:${this.phone.replace(/\s/g, '')}`;

  protected onCartQuantityChange(event: DsCartQuantityChangeEvent): void {
    this.cart.setQuantity(event.line.product.id, event.line.pack.id, event.quantity);
  }

  protected onCartLineRemove(line: DsCartAddEvent): void {
    this.cart.remove(line.product.id, line.pack.id);
  }

  protected onConfirmOrder(): void {
    this.cartOpen.set(false);
    this.router.navigateByUrl('/checkout');
  }
}
