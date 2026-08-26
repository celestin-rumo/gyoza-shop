import { Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AdminProductService, ProductLot } from '../../../services/admin-product.service';
import { Product } from '../../../models/product.model';
import { Pack } from '../../../models/pack.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsNumberStepperComponent } from '../../../design-system';
import { AdminPackRow } from '../admin-pack-row/admin-pack-row';

@Component({
  selector: 'app-admin-product-row',
  imports: [DsButtonComponent, DsNumberStepperComponent, AdminPackRow],
  templateUrl: './admin-product-row.html',
  styleUrl: './admin-product-row.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class AdminProductRow {
  private readonly adminProductService = inject(AdminProductService);

  product = input.required<Product>();
  productUpdated = output<Product>();

  protected readonly stockDelta = signal(1);

  protected readonly showStockConfirm = signal(false);
  protected readonly confirmingStock = signal(false);
  protected readonly stockConfirmError = signal<string | null>(null);

  protected readonly lots = signal<ProductLot[]>([]);
  protected readonly loadingLots = signal(false);
  protected readonly selectedLotId = signal<number | null>(null);

  protected readonly isAddingStock = computed(() => this.stockDelta() > 0);
  protected readonly quantityAbs = computed(() => Math.abs(this.stockDelta()));
  protected readonly selectedLot = computed(
    () => this.lots().find((lot) => lot.productOutputId === this.selectedLotId()) ?? null,
  );
  protected readonly canConfirmStock = computed(() => {
    if (this.isAddingStock()) {
      return true;
    }

    const lot = this.selectedLot();
    return lot !== null && this.quantityAbs() <= lot.remainingQuantity;
  });

  protected readonly togglingActive = signal(false);
  protected readonly statusError = signal<string | null>(null);

  protected readonly newPackSize = signal(6);
  protected readonly newPackPrice = signal(0);
  protected readonly addingPack = signal(false);
  protected readonly packError = signal<string | null>(null);
  protected readonly canAddPack = computed(() => this.newPackSize() > 0 && this.newPackPrice() > 0);

  protected openStockConfirm(): void {
    if (this.stockDelta() === 0) {
      return;
    }

    this.stockConfirmError.set(null);
    this.showStockConfirm.set(true);

    if (!this.isAddingStock()) {
      this.loadLots();
    }
  }

  protected closeStockConfirm(): void {
    this.showStockConfirm.set(false);
    this.lots.set([]);
    this.selectedLotId.set(null);
    this.stockConfirmError.set(null);
  }

  protected onLotChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedLotId.set(value ? Number(value) : null);
  }

  protected onEscape(): void {
    if (this.showStockConfirm()) {
      this.closeStockConfirm();
    }
  }

  protected async confirmStockChange(): Promise<void> {
    if (!this.canConfirmStock()) {
      return;
    }

    this.confirmingStock.set(true);
    this.stockConfirmError.set(null);

    try {
      const updated = this.isAddingStock()
        ? await firstValueFrom(
            this.adminProductService.addStock(this.product().id, this.quantityAbs()),
          )
        : await firstValueFrom(
            this.adminProductService.removeStockFromLot(
              this.product().id,
              this.selectedLot()!.productOutputId,
              this.quantityAbs(),
            ),
          );

      this.productUpdated.emit(updated);
      this.stockDelta.set(1);
      this.closeStockConfirm();
    } catch (error) {
      this.stockConfirmError.set(this.extractStockErrorMessage(error));
    } finally {
      this.confirmingStock.set(false);
    }
  }

  private async loadLots(): Promise<void> {
    this.loadingLots.set(true);

    try {
      const lots = await firstValueFrom(this.adminProductService.getLots(this.product().id));
      this.lots.set(lots);
      this.selectedLotId.set(lots[0]?.productOutputId ?? null);
    } catch {
      this.stockConfirmError.set('Impossible de charger les lots.');
    } finally {
      this.loadingLots.set(false);
    }
  }

  private extractStockErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return this.isAddingStock() ? 'Impossible d’ajouter le stock.' : 'Impossible de retirer ce stock.';
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
