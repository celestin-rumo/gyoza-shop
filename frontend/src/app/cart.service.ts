import { Injectable, computed, signal } from '@angular/core';
import { DsCartAddEvent } from './design-system';

/**
 * Panier partagé par toutes les pages : ajouter un pack de poulet depuis l'accueil
 * puis un autre depuis "Nos gyozas" alimente le même panier.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly lines = signal<DsCartAddEvent[]>([]);

  readonly count = computed(() => this.lines().reduce((total, line) => total + line.quantity, 0));

  add(event: DsCartAddEvent): void {
    this.lines.update((lines) => {
      const existing = lines.find(
        (line) => line.product.id === event.product.id && line.pack.id === event.pack.id,
      );

      if (existing) {
        return lines.map((line) =>
          line === existing ? { ...line, quantity: line.quantity + event.quantity } : line,
        );
      }

      return [...lines, event];
    });
  }

  remove(productId: string, packId: string): void {
    this.lines.update((lines) =>
      lines.filter((line) => !(line.product.id === productId && line.pack.id === packId)),
    );
  }

  /** Quantité déjà présente dans le panier pour un produit donné, par id de pack. */
  packQuantitiesInCart(productId: string): Record<string, number> {
    const quantities: Record<string, number> = {};

    for (const line of this.lines()) {
      if (line.product.id === productId) {
        quantities[line.pack.id] = (quantities[line.pack.id] ?? 0) + line.quantity;
      }
    }

    return quantities;
  }
}
