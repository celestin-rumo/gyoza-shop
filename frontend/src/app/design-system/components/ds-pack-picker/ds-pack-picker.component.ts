import { Component, computed, input, output, signal } from '@angular/core';
import { DsButtonComponent } from '../ds-button/ds-button.component';

export interface DsProductPack {
  id: string;
  label: string;
  count: number;
  price: number;
  currency?: string;
}

export interface DsPackSelection {
  pack: DsProductPack;
  quantity: number;
}

/**
 * <ds-pack-picker [packs]="gyozaPoulet.packs" (add)="onPackAdd($event)"></ds-pack-picker>
 *
 * Utilisé pour : choisir un pack (6 / 10 / 20 gyozas) et une quantité avant ajout au panier.
 * Chaque clic sur "Ajouter" émet une sélection indépendante : l'utilisateur peut par exemple
 * ajouter un pack de 6 puis, sans perdre le premier, changer de pack et ajouter un pack de 10.
 */
@Component({
  selector: 'ds-pack-picker',
  imports: [DsButtonComponent],
  templateUrl: './ds-pack-picker.component.html',
  styleUrl: './ds-pack-picker.component.scss',
})
export class DsPackPickerComponent {
  packs = input.required<DsProductPack[]>();
  /** Quantité déjà présente dans le panier pour ce produit, par id de pack. */
  quantitiesInCart = input<Record<string, number>>({});

  add = output<DsPackSelection>();
  remove = output<DsProductPack>();

  protected readonly selectedPackId = signal<string | null>(null);
  protected readonly quantity = signal(1);

  protected readonly selectedPack = computed(
    () => this.packs().find((pack) => pack.id === this.selectedPackId()) ?? this.packs()[0] ?? null,
  );

  protected readonly selectedPackQuantityInCart = computed(() => {
    const pack = this.selectedPack();
    return pack ? this.quantityInCart(pack.id) : 0;
  });

  protected quantityInCart(packId: string): number {
    return this.quantitiesInCart()[packId] ?? 0;
  }

  protected selectPack(id: string): void {
    this.selectedPackId.set(id);
  }

  protected increment(): void {
    this.quantity.update((value) => value + 1);
  }

  protected decrement(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  protected onAdd(): void {
    const pack = this.selectedPack();
    if (!pack) {
      return;
    }
    this.add.emit({ pack, quantity: this.quantity() });
    this.quantity.set(1);
  }

  protected onRemove(): void {
    const pack = this.selectedPack();
    if (!pack) {
      return;
    }
    this.remove.emit(pack);
  }

  protected formatPrice(value: number, currency = '€'): string {
    return `${value.toFixed(2).replace('.', ',')} ${currency}`;
  }
}
