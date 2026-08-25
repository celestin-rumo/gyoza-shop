import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';

import { AdminRawMaterialService } from '../../../services/admin-raw-material.service';
import { AuthService } from '../../../services/auth.service';
import { RawMaterial } from '../../../models/raw-material.model';
import { PurchaseSource, RawMaterialPurchase } from '../../../models/raw-material-purchase.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';
import { DsPricePipe } from '../../../design-system/pipes/ds-price.pipe';
import { DsNumberStepperComponent } from '../../../design-system';
import { AdminRawMaterialRow } from '../admin-raw-material-row/admin-raw-material-row';

interface NewRawMaterial {
  name: string;
  unit: string;
}

@Component({
  selector: 'app-admin-raw-materials',
  imports: [
    DsSectionHeaderComponent,
    DsButtonComponent,
    DsPricePipe,
    DsNumberStepperComponent,
    FormField,
    FormRoot,
    RouterLink,
    AdminRawMaterialRow,
  ],
  templateUrl: './admin-raw-materials.html',
  styleUrl: './admin-raw-materials.scss',
})
export class AdminRawMaterials implements OnInit {
  private readonly adminRawMaterialService = inject(AdminRawMaterialService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
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
            this.createError.set(
              this.extractErrorMessage(error, 'Impossible de créer cette matière première.'),
            );
          } finally {
            this.creating.set(false);
          }

          return undefined;
        },
      },
    },
  );

  // --- Purchase history, filterable by raw material (or "all") ---

  protected readonly selectedRawMaterialId = signal<number | null>(null);
  protected readonly selectedRawMaterial = computed(
    () => this.rawMaterials().find((material) => material.id === this.selectedRawMaterialId()) ?? null,
  );

  protected readonly purchases = signal<RawMaterialPurchase[]>([]);
  protected readonly loadingPurchases = signal(false);
  protected readonly loadPurchasesError = signal<string | null>(null);

  protected readonly purchaseDate = signal(this.today());
  protected readonly quantityPurchased = signal(0);
  protected readonly totalPricePaid = signal(0);
  protected readonly source = signal<PurchaseSource>('MANUAL');
  protected readonly originCountry = signal('');
  protected readonly store = signal('');
  protected readonly batchNumber = signal('');
  protected readonly creatingPurchase = signal(false);
  protected readonly createPurchaseError = signal<string | null>(null);

  protected readonly canSubmitPurchase = computed(
    () =>
      this.selectedRawMaterialId() !== null &&
      this.purchaseDate().length > 0 &&
      this.quantityPurchased() > 0 &&
      this.totalPricePaid() > 0 &&
      this.originCountry().trim().length > 0 &&
      this.store().trim().length > 0,
  );

  private readonly achatsSection = viewChild<ElementRef<HTMLElement>>('achatsSection');

  async ngOnInit(): Promise<void> {
    const rawMaterialIdParam = this.route.snapshot.queryParamMap.get('rawMaterialId');

    this.loading.set(true);
    this.loadError.set(null);

    try {
      const rawMaterials = await firstValueFrom(this.adminRawMaterialService.getAllRawMaterials());
      this.rawMaterials.set(rawMaterials);

      const preselected = rawMaterialIdParam ? Number(rawMaterialIdParam) : null;
      const validPreselected =
        preselected !== null && rawMaterials.some((material) => material.id === preselected)
          ? preselected
          : null;

      this.selectedRawMaterialId.set(validPreselected);
      await this.loadPurchases(validPreselected);
    } catch {
      this.loadError.set('Impossible de charger les matières premières.');
    } finally {
      this.loading.set(false);
    }
  }

  protected onRawMaterialUpdated(updated: RawMaterial): void {
    this.rawMaterials.update((materials) =>
      materials.map((material) => (material.id === updated.id ? updated : material)),
    );
  }

  protected onRawMaterialDeleted(deletedId: number): void {
    this.rawMaterials.update((materials) => materials.filter((material) => material.id !== deletedId));

    if (this.selectedRawMaterialId() === deletedId) {
      this.selectPurchaseFilter(null);
    }
  }

  protected onPurchaseFilterChanged(value: string): void {
    this.selectPurchaseFilter(value ? Number(value) : null);
  }

  protected viewHistoryFor(rawMaterialId: number): void {
    this.selectPurchaseFilter(rawMaterialId);
    queueMicrotask(() => this.achatsSection()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  protected unitFor(rawMaterialId: number): string {
    return this.rawMaterials().find((material) => material.id === rawMaterialId)?.unit ?? '';
  }

  protected async createPurchase(): Promise<void> {
    const rawMaterialId = this.selectedRawMaterialId();
    if (rawMaterialId === null || !this.canSubmitPurchase()) {
      return;
    }

    this.creatingPurchase.set(true);
    this.createPurchaseError.set(null);

    try {
      await firstValueFrom(
        this.adminRawMaterialService.createPurchase({
          rawMaterialId,
          date: this.purchaseDate(),
          quantityPurchased: this.quantityPurchased(),
          totalPricePaid: this.totalPricePaid(),
          source: this.source(),
          originCountry: this.originCountry(),
          store: this.store(),
          batchNumber: this.batchNumber().trim().length > 0 ? this.batchNumber() : null,
        }),
      );

      this.quantityPurchased.set(0);
      this.totalPricePaid.set(0);
      this.purchaseDate.set(this.today());
      this.originCountry.set('');
      this.store.set('');
      this.batchNumber.set('');

      await Promise.all([
        this.loadPurchases(rawMaterialId),
        firstValueFrom(this.adminRawMaterialService.getAllRawMaterials()).then((rawMaterials) =>
          this.rawMaterials.set(rawMaterials),
        ),
      ]);
    } catch (error) {
      this.createPurchaseError.set(this.extractErrorMessage(error, "Impossible d’enregistrer cet achat."));
    } finally {
      this.creatingPurchase.set(false);
    }
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  private selectPurchaseFilter(rawMaterialId: number | null): void {
    this.selectedRawMaterialId.set(rawMaterialId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: rawMaterialId ? { rawMaterialId } : {},
      replaceUrl: true,
    });

    this.loadPurchases(rawMaterialId);
  }

  private async loadPurchases(rawMaterialId: number | null): Promise<void> {
    this.loadingPurchases.set(true);
    this.loadPurchasesError.set(null);

    try {
      const purchases = await firstValueFrom(
        this.adminRawMaterialService.getPurchases(rawMaterialId ?? undefined),
      );
      this.purchases.set(purchases);
    } catch {
      this.loadPurchasesError.set("Impossible de charger l'historique des achats.");
    } finally {
      this.loadingPurchases.set(false);
    }
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return fallback;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
