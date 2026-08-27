import { Component, computed, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AdminRawMaterialService } from '../../../services/admin-raw-material.service';
import { RawMaterial } from '../../../models/raw-material.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsPricePipe } from '../../../design-system/pipes/ds-price.pipe';

@Component({
  selector: 'app-admin-raw-material-row',
  imports: [DsButtonComponent, DsPricePipe],
  templateUrl: './admin-raw-material-row.html',
  styleUrl: './admin-raw-material-row.scss',
})
export class AdminRawMaterialRow {
  private readonly adminRawMaterialService = inject(AdminRawMaterialService);

  rawMaterial = input.required<RawMaterial>();
  rawMaterialUpdated = output<RawMaterial>();
  rawMaterialDeleted = output<number>();
  viewHistory = output<number>();

  protected readonly editing = signal(false);
  protected readonly name = signal('');
  protected readonly unit = signal('');
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly canSave = computed(() => this.name().trim().length > 0 && this.unit().trim().length > 0);

  protected startEditing(): void {
    this.name.set(this.rawMaterial().name);
    this.unit.set(this.rawMaterial().unit);
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
        this.adminRawMaterialService.updateRawMaterial(this.rawMaterial().id, {
          name: this.name(),
          unit: this.unit(),
        }),
      );

      this.rawMaterialUpdated.emit(updated);
      this.editing.set(false);
    } catch {
      this.error.set('Impossible d’enregistrer cette matière première.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async delete(): Promise<void> {
    if (!confirm(`Supprimer « ${this.rawMaterial().name} » ?`)) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(this.adminRawMaterialService.deleteRawMaterial(this.rawMaterial().id));
      this.rawMaterialDeleted.emit(this.rawMaterial().id);
    } catch {
      this.error.set('Impossible de supprimer cette matière première (achats enregistrés ?).');
      this.deleting.set(false);
    }
  }
}
