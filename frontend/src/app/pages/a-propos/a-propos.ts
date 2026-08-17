import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../cart.service';
import {
  DsButtonComponent,
  DsCartAddEvent,
  DsCartPanelComponent,
  DsCartQuantityChangeEvent,
  DsFooterComponent,
  DsNavbarComponent,
  DsNavLink,
  DsSectionHeaderComponent,
} from '../../design-system';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

@Component({
  selector: 'app-a-propos',
  imports: [
    NgOptimizedImage,
    DsNavbarComponent,
    DsSectionHeaderComponent,
    DsButtonComponent,
    DsCartPanelComponent,
    DsFooterComponent,
  ],
  templateUrl: './a-propos.html',
  styleUrl: './a-propos.scss',
})
export class APropos {
  private readonly router = inject(Router);
  protected readonly cart = inject(CartService);
  protected readonly cartOpen = signal(false);

  protected readonly navLinks: DsNavLink[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Nos gyozas', href: '/nos-gyozas' },
    { label: 'À propos', href: '/a-propos', active: true },
    { label: 'Contact', href: '/contact' },
  ];

  protected readonly team: TeamMember[] = [
    { name: 'Célestin', role: 'Ingénieur logiciel', bio: 'Le reste du temps derrière un écran.' },
    { name: 'Délia', role: 'Professeure', bio: 'Le reste du temps devant un tableau.' },
  ];

  protected onDiscoverGyozas(): void {
    this.router.navigateByUrl('/nos-gyozas');
  }

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
