import { Component, computed, input, output, signal } from '@angular/core';
import { DsButtonComponent } from '../ds-button/ds-button.component';
import { DsPricePipe } from '../../pipes/ds-price.pipe';

export interface DsProductPack {
  id: number;
  count: number;
  price: number;
  label: string;
}

export interface DsPackSelection {
  pack: DsProductPack;
  quantity: number;
}

/**
 * <ds-pack-picker [packs]="gyozaPoulet.packs" (add)="onPackAdd($event)"></ds-pack-picker>
 *
 * Used for: choosing a pack (6 / 10 / 20 gyozas) and a quantity before adding to cart.
 * Each click on "Add" emits an independent selection: for example, the user can
 * add a pack of 6, then, without losing the first one, switch packs and add a pack of 10.
 */
@Component({
  selector: 'ds-pack-picker',
  imports: [DsButtonComponent, DsPricePipe],
  templateUrl: './ds-pack-picker.component.html',
  styleUrl: './ds-pack-picker.component.scss',
})
export class DsPackPickerComponent {
  packs = input.required<DsProductPack[]>();
  /** Quantity already in the cart for this product, by pack id. */
  quantitiesInCart = input<Record<string, number>>({});

  add = output<DsPackSelection>();
  remove = output<DsProductPack>();

  protected readonly selectedPackId = signal<number | null>(null);
  protected readonly quantity = signal(1);

  protected readonly selectedPack = computed(
    () => this.packs().find((pack) => pack.id === this.selectedPackId()) ?? this.packs()[0] ?? null,
  );

  protected readonly selectedPackQuantityInCart = computed(() => {
    const pack = this.selectedPack();
    return pack ? this.quantityInCart(pack.id) : 0;
  });

  protected quantityInCart(packId: number): number {
    return this.quantitiesInCart()[packId] ?? 0;
  }

  protected selectPack(packId: number): void {
    this.selectedPackId.set(packId);
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
}
