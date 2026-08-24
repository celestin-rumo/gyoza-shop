import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AdminRawMaterialService } from '../../../services/admin-raw-material.service';
import { AuthService } from '../../../services/auth.service';
import { RawMaterial } from '../../../models/raw-material.model';
import { PurchaseSource, RawMaterialPurchase } from '../../../models/raw-material-purchase.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';
import { DsPricePipe } from '../../../design-system/pipes/ds-price.pipe';

@Component({
  selector: 'app-admin-raw-material-purchases',
  imports: [DsSectionHeaderComponent, DsButtonComponent, DsPricePipe, RouterLink],
  templateUrl: './admin-raw-material-purchases.html',
  styleUrl: './admin-raw-material-purchases.scss',
})
export class AdminRawMaterialPurchases implements OnInit {
  private readonly adminRawMaterialService = inject(AdminRawMaterialService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly rawMaterials = signal<RawMaterial[]>([]);
  protected readonly loadingRawMaterials = signal(true);

  protected readonly selectedRawMaterialId = signal<number | null>(null);
  protected readonly selectedRawMaterial = computed(() =>
    this.rawMaterials().find((material) => material.id === this.selectedRawMaterialId()) ?? null,
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

  protected readonly canSubmit = computed(
    () =>
      this.selectedRawMaterialId() !== null &&
      this.purchaseDate().length > 0 &&
      this.quantityPurchased() > 0 &&
      this.totalPricePaid() > 0 &&
      this.originCountry().trim().length > 0 &&
      this.store().trim().length > 0,
  );

  async ngOnInit(): Promise<void> {
    const rawMaterialIdParam = this.route.snapshot.queryParamMap.get('rawMaterialId');

    this.loadingRawMaterials.set(true);

    try {
      const rawMaterials = await firstValueFrom(this.adminRawMaterialService.getAllRawMaterials());
      this.rawMaterials.set(rawMaterials);

      const preselected = rawMaterialIdParam ? Number(rawMaterialIdParam) : null;
      if (preselected !== null && rawMaterials.some((material) => material.id === preselected)) {
        this.selectRawMaterial(preselected);
      }
    } finally {
      this.loadingRawMaterials.set(false);
    }
  }

  protected onRawMaterialSelected(value: string): void {
    const id = value ? Number(value) : null;
    this.selectRawMaterial(id);
  }

  protected selectRawMaterial(rawMaterialId: number | null): void {
    this.selectedRawMaterialId.set(rawMaterialId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: rawMaterialId ? { rawMaterialId } : {},
      replaceUrl: true,
    });

    if (rawMaterialId !== null) {
      this.loadPurchases(rawMaterialId);
    } else {
      this.purchases.set([]);
    }
  }

  protected async createPurchase(): Promise<void> {
    const rawMaterialId = this.selectedRawMaterialId();
    if (rawMaterialId === null || !this.canSubmit()) {
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

      await this.loadPurchases(rawMaterialId);
      this.rawMaterials.set(await firstValueFrom(this.adminRawMaterialService.getAllRawMaterials()));
    } catch (error) {
      this.createPurchaseError.set(this.extractErrorMessage(error));
    } finally {
      this.creatingPurchase.set(false);
    }
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  private async loadPurchases(rawMaterialId: number): Promise<void> {
    this.loadingPurchases.set(true);
    this.loadPurchasesError.set(null);

    try {
      const purchases = await firstValueFrom(this.adminRawMaterialService.getPurchases(rawMaterialId));
      this.purchases.set(purchases);
    } catch {
      this.loadPurchasesError.set("Impossible de charger l'historique des achats.");
    } finally {
      this.loadingPurchases.set(false);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return "Impossible d’enregistrer cet achat.";
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
