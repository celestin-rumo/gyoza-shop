import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CartService } from '../../cart.service';
import {
  DsCartAddEvent,
  DsCartRemoveEvent,
  DsOriginCardComponent,
  DsProduct,
  DsRecipeCardComponent,
  DsRecipeIngredient,
  DsSectionHeaderComponent,
} from '../../design-system';

interface GalleryImage {
  url: string;
  alt: string;
  caption: string;
}

interface CookingStep {
  title: string;
  text: string;
}

@Component({
  selector: 'app-nos-gyozas',
  imports: [NgOptimizedImage, DsSectionHeaderComponent, DsOriginCardComponent, DsRecipeCardComponent],
  templateUrl: './nos-gyozas.html',
  styleUrl: './nos-gyozas.scss',
})
export class NosGyozas {
  protected readonly cart = inject(CartService);

  // TODO: remplacer par les vraies URLs des fournisseurs.
  protected readonly flourSupplierUrl = '#';
  protected readonly chickenSupplierUrl = '#';
  protected readonly vegetablesSupplierUrl = '#';

  protected readonly gyozaPoulet: DsProduct = {
    id: 'poulet',
    tagTone: 'accent',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Chicken_Gyoza_-_Rawlab_Juice_%26_Tea_2025-07-12.jpg/960px-Chicken_Gyoza_-_Rawlab_Juice_%26_Tea_2025-07-12.jpg',
    imageAlt: 'Gyozas au poulet fermier, saisis et dorés',
    name: 'Gyozas au poulet',
    description: 'Poulet fermier, chou, oignon vert et gingembre, pliés à la main.',
    packs: [
      { id: 'poulet-6', label: 'Pack de 6', count: 6, price: 8.9 },
      { id: 'poulet-10', label: 'Pack de 10', count: 10, price: 13.9 },
      { id: 'poulet-20', label: 'Pack de 20', count: 20, price: 24.9 },
    ],
  };

  protected readonly pouletIngredients: DsRecipeIngredient[] = [
    { label: 'Poulet fermier', origin: 'Ferme d’Arrenay, Ependes' },
    { label: 'Pâte à gyoza', origin: 'Farine d’un paysan d’Ependes' },
    { label: 'Chou chinois' },
    { label: 'Oignon vert' },
    { label: 'Gingembre frais' },
    { label: 'Ail' },
    { label: 'Sauce soja' },
    { label: 'Huile de sésame' },
    { label: 'Sel, poivre' },
  ];

  protected readonly gyozaLegumes: DsProduct = {
    id: 'legumes',
    tagTone: 'neutral',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Shiitake_mushroom_gyoza%2C_sesame_soy_dip_-_Yamu_Yamu_2026-07-23.jpg/960px-Shiitake_mushroom_gyoza%2C_sesame_soy_dip_-_Yamu_Yamu_2026-07-23.jpg',
    imageAlt: 'Gyozas aux légumes de saison servis avec une sauce',
    name: 'Gyozas aux légumes',
    description: 'Chou, carotte, champignon et ciboulette, pour une version 100% végétale.',
    packs: [
      { id: 'legumes-6', label: 'Pack de 6', count: 6, price: 7.9 },
      { id: 'legumes-10', label: 'Pack de 10', count: 10, price: 12.5 },
      { id: 'legumes-20', label: 'Pack de 20', count: 20, price: 22.9 },
    ],
  };

  protected readonly legumesIngredients: DsRecipeIngredient[] = [
    { label: 'Légumes de saison', origin: 'Chou, carotte et champignon de producteurs de la région' },
    { label: 'Pâte à gyoza', origin: 'Farine d’un paysan d’Ependes' },
    { label: 'Oignon vert' },
    { label: 'Gingembre frais' },
    { label: 'Sauce soja' },
    { label: 'Huile de sésame' },
    { label: 'Sel, poivre' },
  ];

  protected readonly cookingSteps: CookingStep[] = [
    {
      title: 'Poêle chaude',
      text: 'Faites chauffer un filet d’huile dans une poêle antiadhésive à feu moyen-vif.',
    },
    {
      title: 'Saisir',
      text: 'Disposez les gyozas côte à côte, base plate contre la poêle, et laissez dorer 2 à 3 minutes sans les retourner.',
    },
    {
      title: 'Vapeur',
      text: 'Ajoutez environ 50 ml d’eau, couvrez aussitôt et laissez cuire à la vapeur 5 minutes.',
    },
    {
      title: 'Croustillant',
      text: 'Retirez le couvercle et laissez l’eau s’évaporer pour retrouver une base croustillante. Servez aussitôt.',
    },
  ];

  protected readonly galleryImages: GalleryImage[] = [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Making_Gyozas_-_Step_4_%28440910521%29.jpg/960px-Making_Gyozas_-_Step_4_%28440910521%29.jpg',
      alt: 'Gyozas pliés à la main un par un',
      caption: 'Chaque gyoza est plié à la main, un par un, pour un résultat vraiment fait maison.',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/%E3%83%95%E3%83%A9%E3%82%A4%E3%83%91%E3%83%B3%E3%81%AB%E5%85%A5%E3%81%A3%E3%81%9F%E9%A4%83%E5%AD%90.jpg/960px-%E3%83%95%E3%83%A9%E3%82%A4%E3%83%91%E3%83%B3%E3%81%AB%E5%85%A5%E3%81%A3%E3%81%9F%E9%A4%83%E5%AD%90.jpg',
      alt: 'Gyozas saisis puis cuits à la vapeur',
      caption: 'Saisis à la poêle puis cuits à la vapeur, pour une base bien croustillante.',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/10pc_Gyoza_plate.jpg/960px-10pc_Gyoza_plate.jpg',
      alt: 'Gyozas prêts à être dégustés avec une sauce',
      caption: 'Servis chauds, prêts à être dégustés avec notre sauce maison.',
    },
  ];

  protected onAddToCart(event: DsCartAddEvent): void {
    this.cart.add(event);
  }

  protected onRemoveFromCart(event: DsCartRemoveEvent): void {
    this.cart.remove(event.product.id, event.pack.id);
  }
}
