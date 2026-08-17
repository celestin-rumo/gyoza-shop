import { Component, signal } from '@angular/core';
import {
  DsBadgeComponent,
  DsButtonComponent,
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
  protected readonly navLinks: DsNavLink[] = [
    { label: 'Accueil', href: '#', active: true },
    { label: 'Nos gyozas', href: '#gyozas' },
    { label: 'À propos', href: '#a-propos' },
    { label: 'Contact', href: '/contact' },
  ];

  protected readonly products: DsProduct[] = [
    {
      id: 'poulet',
      tagTone: 'accent',
      imageUrl: 'https://placehold.co/240x180/1c1b18/e6a68c?text=Poulet',
      imageAlt: 'Gyozas au poulet',
      name: 'Poulet',
      description: 'Poulet fermier, chou, oignon vert, gingembre.',
      price: 8.9,
    },
    {
      id: 'legumes',
      tagTone: 'neutral',
      imageUrl: 'https://placehold.co/240x180/1c1b18/a9a6a0?text=L%C3%A9gumes',
      imageAlt: 'Gyozas aux légumes',
      name: 'Légumes',
      description: 'Chou, carotte, champignon, ciboulette, gingembre.',
      price: 7.9,
    },
  ];

  protected readonly cartCount = signal(0);

  protected onAddToCart(_product: DsProduct): void {
    this.cartCount.update((count) => count + 1);
  }
}
