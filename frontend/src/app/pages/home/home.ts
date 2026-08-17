import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../cart.service';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCartAddEvent,
  DsCartRemoveEvent,
  DsFeatureItemComponent,
  DsFooterComponent,
  DsNavbarComponent,
  DsNavLink,
  DsProduct,
  DsProductCardComponent,
  DsSectionHeaderComponent,
} from '../../design-system';

@Component({
  selector: 'app-home',
  imports: [
    DsNavbarComponent,
    DsButtonComponent,
    DsFeatureItemComponent,
    DsBadgeComponent,
    DsSectionHeaderComponent,
    DsProductCardComponent,
    DsFooterComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  protected readonly cart = inject(CartService);

  protected readonly navLinks: DsNavLink[] = [
    { label: 'Accueil', href: '#', active: true },
    { label: 'Nos gyozas', href: '/nos-gyozas' },
    { label: 'À propos', href: '#a-propos' },
    { label: 'Contact', href: '/contact' },
  ];

  protected readonly products: DsProduct[] = [
    {
      id: 'poulet',
      tagTone: 'accent',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Chicken_Gyoza_-_Rawlab_Juice_%26_Tea_2025-07-12.jpg/960px-Chicken_Gyoza_-_Rawlab_Juice_%26_Tea_2025-07-12.jpg',
      imageAlt: 'Gyozas au poulet dorés et croustillants',
      name: 'Poulet',
      description: 'Poulet fermier, chou, oignon vert, gingembre.',
      packs: [
        { id: 'poulet-6', label: 'Pack de 6', count: 6, price: 8.9 },
        { id: 'poulet-10', label: 'Pack de 10', count: 10, price: 13.9 },
        { id: 'poulet-20', label: 'Pack de 20', count: 20, price: 24.9 },
      ],
    },
    {
      id: 'legumes',
      tagTone: 'neutral',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Shiitake_mushroom_gyoza%2C_sesame_soy_dip_-_Yamu_Yamu_2026-07-23.jpg/960px-Shiitake_mushroom_gyoza%2C_sesame_soy_dip_-_Yamu_Yamu_2026-07-23.jpg',
      imageAlt: 'Gyozas aux champignons shiitake et légumes',
      name: 'Légumes',
      description: 'Chou, carotte, champignon, ciboulette, gingembre.',
      packs: [
        { id: 'legumes-6', label: 'Pack de 6', count: 6, price: 7.9 },
        { id: 'legumes-10', label: 'Pack de 10', count: 10, price: 12.5 },
        { id: 'legumes-20', label: 'Pack de 20', count: 20, price: 22.9 },
      ],
    },
  ];

  protected onAddToCart(event: DsCartAddEvent): void {
    this.cart.add(event);
  }

  protected onRemoveFromCart(event: DsCartRemoveEvent): void {
    this.cart.remove(event.product.id, event.pack.id);
  }

  protected onDiscoverGyozas(): void {
    this.router.navigateByUrl('/nos-gyozas');
  }
}
