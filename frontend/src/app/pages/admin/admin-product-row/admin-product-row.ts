import { Component, computed, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AdminProductService } from '../../../services/admin-product.service';
import { Product } from '../../../models/product.model';
import { Pack } from '../../../models/pack.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsNumberStepperComponent } from '../../../design-system';
import { AdminPackRow } from '../admin-pack-row/admin-pack-row';

const QUICK_STOCK_STEPS = [10, 50, 100];

@Component({
  selector: 'app-admin-product-row',
  imports: [DsButtonComponent, DsNumberStepperComponent, AdminPackRow],
  templateUrl: './admin-product-row.html',
  styleUrl: './admin-product-row.scss',
})
export class AdminProductRow {
  private readonly adminProductService = inject(AdminProductService);

  product = input.required<Product>();
  productUpdated = output<Product>();

  protected readonly quickStockSteps = QUICK_STOCK_STEPS;

  protected readonly stockToAdd = signal(10);
  protected readonly addingStock = signal(false);
  protected readonly stockToRemove = signal(10);
  protected readonly removingStock = signal(false);
  protected readonly stockError = signal<string | null>(null);

  protected readonly togglingActive = signal(false);
  protected readonly statusError = signal<string | null>(null);

  protected readonly newPackSize = signal(6);
  protected readonly newPackPrice = signal(0);
  protected readonly addingPack = signal(false);
  protected readonly packError = signal<string | null>(null);
  protected readonly canAddPack = computed(() => this.newPackSize() > 0 && this.newPackPrice() > 0);

  protected async addStock(quantity: number): Promise<void> {
    if (quantity <= 0) {
      return;
    }

    this.addingStock.set(true);
    this.stockError.set(null);

    try {
      const updated = await firstValueFrom(
        this.adminProductService.addStock(this.product().id, quantity),
      );
      this.productUpdated.emit(updated);
    } catch {
      this.stockError.set('Impossible d’ajouter le stock.');
    } finally {
      this.addingStock.set(false);
    }
  }

  protected async removeStock(quantity: number): Promise<void> {
    if (quantity <= 0) {
      return;
    }

    this.removingStock.set(true);
    this.stockError.set(null);

    try {
      const updated = await firstValueFrom(
        this.adminProductService.removeStock(this.product().id, quantity),
      );
      this.productUpdated.emit(updated);
    } catch {
      this.stockError.set('Impossible de retirer ce stock (quantité insuffisante ?).');
    } finally {
      this.removingStock.set(false);
    }
  }

  protected async toggleActive(): Promise<void> {
    this.togglingActive.set(true);
    this.statusError.set(null);

    try {
      const updated = await firstValueFrom(
        this.adminProductService.setActive(this.product().id, !this.product().active),
      );
      this.productUpdated.emit(updated);
    } catch {
      this.statusError.set('Impossible de changer le statut.');
    } finally {
      this.togglingActive.set(false);
    }
  }

  protected async addPack(): Promise<void> {
    if (!this.canAddPack()) {
      return;
    }

    this.addingPack.set(true);
    this.packError.set(null);

    try {
      const pack = await firstValueFrom(
        this.adminProductService.addPack(this.product().id, {
          size: this.newPackSize(),
          price: this.newPackPrice(),
        }),
      );

      this.productUpdated.emit({
        ...this.product(),
        packs: [...this.product().packs, pack],
      });

      this.newPackSize.set(6);
      this.newPackPrice.set(0);
    } catch {
      this.packError.set('Impossible d’ajouter ce pack.');
    } finally {
      this.addingPack.set(false);
    }
  }

  protected onPackUpdated(updatedPack: Pack): void {
    this.productUpdated.emit({
      ...this.product(),
      packs: this.product().packs.map((pack) =>
        pack.id === updatedPack.id ? updatedPack : pack,
      ),
    });
  }

  protected onPackDeleted(deletedPackId: number): void {
    this.productUpdated.emit({
      ...this.product(),
      packs: this.product().packs.filter((pack) => pack.id !== deletedPackId),
    });
  }
}
