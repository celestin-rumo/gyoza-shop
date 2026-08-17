import { Component, computed, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AdminProductService } from '../../../services/admin-product.service';
import { Pack } from '../../../models/pack.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsPricePipe } from '../../../design-system/pipes/ds-price.pipe';

@Component({
  selector: 'app-admin-pack-row',
  imports: [DsButtonComponent, DsPricePipe],
  templateUrl: './admin-pack-row.html',
  styleUrl: './admin-pack-row.scss',
})
export class AdminPackRow {
  private readonly adminProductService = inject(AdminProductService);

  pack = input.required<Pack>();
  packUpdated = output<Pack>();
  packDeleted = output<number>();

  protected readonly editing = signal(false);
  protected readonly size = signal(0);
  protected readonly price = signal(0);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly canSave = computed(() => this.size() > 0 && this.price() > 0);

  protected startEditing(): void {
    this.size.set(this.pack().size);
    this.price.set(this.pack().price);
    this.error.set(null);
    this.editing.set(true);
  }

  protected cancelEditing(): void {
    this.editing.set(false);
    this.error.set(null);
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const updated = await firstValueFrom(
        this.adminProductService.updatePack(this.pack().id, {
          size: this.size(),
          price: this.price(),
        }),
      );

      this.packUpdated.emit(updated);
      this.editing.set(false);
    } catch {
      this.error.set('Impossible d’enregistrer ce pack.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async delete(): Promise<void> {
    if (!confirm(`Supprimer le pack de ${this.pack().size} ?`)) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(this.adminProductService.deletePack(this.pack().id));
      this.packDeleted.emit(this.pack().id);
    } catch {
      this.error.set('Impossible de supprimer ce pack.');
      this.deleting.set(false);
    }
  }
}
