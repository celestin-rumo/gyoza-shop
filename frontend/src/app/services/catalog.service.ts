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

/** Neutral placeholder image for a product freshly created in the admin, until a photo has been chosen. */
const PLACEHOLDER_IMAGE_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">' +
      '<rect width="960" height="640" fill="#161513"/>' +
      '<circle cx="480" cy="320" r="120" fill="none" stroke="#a9a6a0" stroke-width="4"/>' +
      '<path d="M420 320a60 60 0 1 1 120 0" fill="none" stroke="#a9a6a0" stroke-width="4"/>' +
      '</svg>',
  );

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
 * Single source of truth for the product catalog (with prices from the database).
 * `load()` is called once when the app starts (see `app.config.ts`); pages then
 * read the result already in memory via `products` / `productsByKey`.
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

  /** All products, mapped for display (homepage grid). */
  readonly products = computed<DsProduct[]>(() =>
    this._products().map((product) => this.toDsProduct(product)),
  );

  /** Mapped products, indexed by their technical name (e.g. "chicken", "vegetable"). */
  readonly productsByKey = computed<Record<string, DsProduct>>(() => {
    const byKey: Record<string, DsProduct> = {};

    for (const product of this._products()) {
      byKey[product.name.toLowerCase()] = this.toDsProduct(product);
    }

    return byKey;
  });

  load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.fetch();
    }

    return this.loadPromise;
  }

  /** Reloads the catalog from the API: call after a change made from the admin. */
  refresh(): Promise<void> {
    this.loadPromise = this.fetch();
    return this.loadPromise;
  }

  private fetch(): Promise<void> {
    return firstValueFrom(this.productService.getProducts())
      .then((products) => {
        this._products.set(products);
        this._error.set(null);
      })
      .catch((error) => {
        console.error('Error GET products', error);
        this._error.set('Impossible de charger le catalogue.');
      })
      .finally(() => {
        this._loading.set(false);
      });
  }

  private toDsProduct(product: Product): DsProduct {
    const presentation = PRESENTATION_BY_PRODUCT_NAME[product.name.toLowerCase()];

    return {
      id: product.id,
      tagTone: presentation?.tagTone ?? 'neutral',
      imageUrl: presentation?.imageUrl ?? PLACEHOLDER_IMAGE_URL,
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
