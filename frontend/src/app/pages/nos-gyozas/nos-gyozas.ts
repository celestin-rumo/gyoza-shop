import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';

import { DsCartAddEvent, DsCartRemoveEvent } from '../../design-system/components/ds-product-card/ds-product-card.component';

import { DsSectionHeaderComponent } from '../../design-system/components/ds-section-header/ds-section-header.component';
import { DsOriginCardComponent } from '../../design-system/components/ds-origin-card/ds-origin-card.component';
import { DsRecipeCardComponent } from '../../design-system/components/ds-recipe-card/ds-recipe-card.component';

@Component({
  selector: 'app-nos-gyozas',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    DsSectionHeaderComponent,
    DsOriginCardComponent,
    DsRecipeCardComponent,
  ],
  templateUrl: './nos-gyozas.html',
  styleUrl: './nos-gyozas.scss',
})
export class NosGyozas {
  private readonly catalog = inject(CatalogService);

  readonly cart = inject(CartService);

  protected readonly gyozaPoulet = computed(() => this.catalog.productsByKey()['chicken']);
  protected readonly gyozaLegumes = computed(() => this.catalog.productsByKey()['vegetable']);

  readonly flourSupplierUrl = 'https://example.com';
  readonly chickenSupplierUrl = 'https://example.com';
  readonly vegetablesSupplierUrl = 'https://example.com';

readonly pouletIngredients = [
  {
    label: 'Poulet fermier',
    origin: 'Ferme d’Arrenay, Ependes',
  },
  {
    label: 'Chou',
    origin: 'Producteurs de la région',
  },
  {
    label: 'Oignon',
  },
  {
    label: 'Gingembre',
  },
  {
    label: 'Ail',
  },
  {
    label: 'Sauce soja',
  },
];

readonly legumesIngredients = [
  {
    label: 'Chou',
    origin: 'Producteurs de la région',
  },
  {
    label: 'Carotte',
    origin: 'Producteurs de la région',
  },
  {
    label: 'Poireau',
    origin: 'Producteurs de la région',
  },
  {
    label: 'Champignons',
  },
  {
    label: 'Gingembre',
  },
  {
    label: 'Ail',
  },
];

  readonly cookingSteps = [
    {
      title: 'Poêler',
      text: 'Déposez les gyozas dans une poêle chaude avec un peu d’huile et laissez dorer le fond.',
    },
    {
      title: 'Ajouter de l’eau',
      text: 'Ajoutez un petit fond d’eau puis couvrez immédiatement.',
    },
    {
      title: 'Cuire à la vapeur',
      text: 'Laissez cuire quelques minutes jusqu’à ce que la pâte soit tendre.',
    },
    {
      title: 'Faire croustiller',
      text: 'Retirez le couvercle et laissez l’eau s’évaporer pour retrouver un fond bien croustillant.',
    },
  ];

  readonly galleryImages = [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Making_Gyozas_-_Step_4_%28440910521%29.jpg/960px-Making_Gyozas_-_Step_4_%28440910521%29.jpg',
      alt: 'Préparation de gyozas faits maison',
      caption: 'Pliés à la main',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/10pc_Gyoza_plate.jpg/960px-10pc_Gyoza_plate.jpg',
      alt: 'Gyozas fraîchement préparés',
      caption: 'Préparés avec soin',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Japanese_pan_fried_gyoza.jpg/960px-Japanese_pan_fried_gyoza.jpg',
      alt: 'Gyozas cuits à la poêle',
      caption: 'Dorés et croustillants',
    },
  ];

  onAddToCart(event: DsCartAddEvent): void {
    this.cart.add(event);
  }

  onRemoveFromCart(event: DsCartRemoveEvent): void {
    this.cart.remove(
      event.product.id,
      event.pack.id,
    );
  }
}