import { Injectable, computed, signal } from '@angular/core';
import { DsCartAddEvent } from '../design-system';

/**
 * Panier partagé par toutes les pages : ajouter un pack de poulet depuis l'accueil
 * puis un autre depuis "Nos gyozas" alimente le même panier.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<DsCartAddEvent[]>([]);
  private readonly _isOpen = signal(false);

  readonly lines = this._lines.asReadonly();
  /** Le panneau panier (ds-cart-panel) est-il ouvert ? Piloté depuis le header ou le bouton flottant. */
  readonly isOpen = this._isOpen.asReadonly();

  readonly count = computed(() => this.lines().reduce((total, line) => total + line.quantity, 0));

  readonly subtotal = computed(() =>
    this.lines().reduce((total, line) => total + line.pack.price * line.quantity, 0),
  );

  add(event: DsCartAddEvent): void {
    this._lines.update((lines) => {
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

  remove(productId: number, packId: number): void {
    this._lines.update((lines) =>
      lines.filter((line) => !(line.product.id === productId && line.pack.id === packId)),
    );
  }

  /** Modifie la quantité d'un élément du panier ; le retire si la quantité tombe à 0 ou moins. */
  setQuantity(productId: number, packId: number, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId, packId);
      return;
    }

    this._lines.update((lines) =>
      lines.map((line) =>
        line.product.id === productId && line.pack.id === packId ? { ...line, quantity } : line,
      ),
    );
  }

  clear(): void {
    this._lines.set([]);
  }

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  /** Quantité déjà présente dans le panier pour un produit donné, par id de pack. */
  packQuantitiesInCart(productId: number): Record<string, number> {
    const quantities: Record<string, number> = {};

    for (const line of this.lines()) {
      if (line.product.id === productId) {
        quantities[line.pack.id] = (quantities[line.pack.id] ?? 0) + line.quantity;
      }
    }

    return quantities;
  }
}
