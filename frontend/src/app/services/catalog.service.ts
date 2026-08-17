import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ProductService } from './product.service';
import { Product } from '../models/product.model';
import { DsProduct, DsProductTagTone } from '../design-system/components/ds-product-card/ds-product-card.component';

interface Presentation {
  name: string;
  tagTone: DsProductTagTone;
  imageUrl: string;
  imageAlt: string;
  description: string;
}

const PRESENTATION_BY_PRODUCT_NAME: Record<string, Presentation> = {
  chicken: {
    name: 'Poulet',
    tagTone: 'accent',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Chicken_Gyoza_-_Rawlab_Juice_%26_Tea_2025-07-12.jpg/960px-Chicken_Gyoza_-_Rawlab_Juice_%26_Tea_2025-07-12.jpg',
    imageAlt: 'Gyozas au poulet dorés et croustillants',
    description: 'Poulet fermier, chou, oignon vert, gingembre.',
  },
  vegetable: {
    name: 'Légumes',
    tagTone: 'neutral',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Shiitake_mushroom_gyoza%2C_sesame_soy_dip_-_Yamu_Yamu_2026-07-23.jpg/960px-Shiitake_mushroom_gyoza%2C_sesame_soy_dip_-_Yamu_Yamu_2026-07-23.jpg',
    imageAlt: 'Gyozas aux légumes',
    description: 'Chou, carotte, champignon, ciboulette, gingembre.',
  },
};

/**
 * Source unique de vérité pour le catalogue produits (avec les prix depuis la base de données).
 * `load()` est appelé une seule fois au démarrage de l'app (voir `app.config.ts`) ; les pages
 * lisent ensuite le résultat déjà en mémoire via `products` / `productsByKey`.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly productService = inject(ProductService);

  private readonly _products = signal<Product[]>([]);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);
  private loadPromise: Promise<void> | null = null;

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Tous les produits, mappés pour l'affichage (grille de l'accueil). */
  readonly products = computed<DsProduct[]>(() =>
    this._products().map((product) => this.toDsProduct(product)),
  );

  /** Produits mappés, indexés par leur nom technique (ex: "chicken", "vegetable"). */
  readonly productsByKey = computed<Record<string, DsProduct>>(() => {
    const byKey: Record<string, DsProduct> = {};

    for (const product of this._products()) {
      byKey[product.name.toLowerCase()] = this.toDsProduct(product);
    }

    return byKey;
  });

  load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = firstValueFrom(this.productService.getProducts())
        .then((products) => {
          this._products.set(products);
        })
        .catch((error) => {
          console.error('Erreur GET products', error);
          this._error.set('Impossible de charger le catalogue.');
        })
        .finally(() => {
          this._loading.set(false);
        });
    }

    return this.loadPromise;
  }

  private toDsProduct(product: Product): DsProduct {
    const presentation = PRESENTATION_BY_PRODUCT_NAME[product.name.toLowerCase()];

    return {
      id: product.id,
      tagTone: presentation?.tagTone ?? 'neutral',
      imageUrl: presentation?.imageUrl ?? '',
      imageAlt: presentation?.imageAlt ?? product.name,
      name: presentation?.name ?? product.name,
      description: presentation?.description ?? '',
      packs: product.packs.map((pack) => ({
        id: pack.id,
        label: `Pack de ${pack.size}`,
        count: pack.size,
        price: pack.price,
      })),
    };
  }
}
