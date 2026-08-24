import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';

import { AdminRawMaterialService } from '../../../services/admin-raw-material.service';
import { AuthService } from '../../../services/auth.service';
import { RawMaterial } from '../../../models/raw-material.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';
import { AdminRawMaterialRow } from '../admin-raw-material-row/admin-raw-material-row';

interface NewRawMaterial {
  name: string;
  unit: string;
}

@Component({
  selector: 'app-admin-raw-materials',
  imports: [DsSectionHeaderComponent, DsButtonComponent, FormField, FormRoot, RouterLink, AdminRawMaterialRow],
  templateUrl: './admin-raw-materials.html',
  styleUrl: './admin-raw-materials.scss',
})
export class AdminRawMaterials implements OnInit {
  private readonly adminRawMaterialService = inject(AdminRawMaterialService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly rawMaterials = signal<RawMaterial[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);

  protected readonly newRawMaterial = signal<NewRawMaterial>({ name: '', unit: '' });

  protected readonly newRawMaterialForm = form(
    this.newRawMaterial,
    (path) => {
      required(path.name, { message: 'Le nom est requis.' });
      required(path.unit, { message: "L'unité est requise." });
    },
    {
      submission: {
        action: async () => {
          this.createError.set(null);
          this.creating.set(true);

          try {
            const rawMaterial = await firstValueFrom(
              this.adminRawMaterialService.createRawMaterial(this.newRawMaterial()),
            );
            this.rawMaterials.update((materials) => [...materials, rawMaterial]);
            this.newRawMaterial.set({ name: '', unit: '' });
          } catch (error) {
            this.createError.set(this.extractErrorMessage(error));
          } finally {
            this.creating.set(false);
          }

          return undefined;
        },
      },
    },
  );

  ngOnInit(): void {
    this.loadRawMaterials();
  }

  protected onRawMaterialUpdated(updated: RawMaterial): void {
    this.rawMaterials.update((materials) =>
      materials.map((material) => (material.id === updated.id ? updated : material)),
    );
  }

  protected onRawMaterialDeleted(deletedId: number): void {
    this.rawMaterials.update((materials) => materials.filter((material) => material.id !== deletedId));
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  private async loadRawMaterials(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const rawMaterials = await firstValueFrom(this.adminRawMaterialService.getAllRawMaterials());
      this.rawMaterials.set(rawMaterials);
    } catch {
      this.loadError.set('Impossible de charger les matières premières.');
    } finally {
      this.loading.set(false);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return 'Impossible de créer cette matière première.';
  }
}
