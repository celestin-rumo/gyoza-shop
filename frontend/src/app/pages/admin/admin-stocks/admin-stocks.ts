import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';

import { AdminProductService } from '../../../services/admin-product.service';
import { AuthService } from '../../../services/auth.service';
import { Product } from '../../../models/product.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';
import { DsNumberStepperComponent } from '../../../design-system';
import { AdminProductRow } from '../admin-product-row/admin-product-row';

interface NewProduct {
  name: string;
  initialStock: number;
}

@Component({
  selector: 'app-admin-stocks',
  imports: [
    DsSectionHeaderComponent,
    DsButtonComponent,
    DsNumberStepperComponent,
    FormField,
    FormRoot,
    RouterLink,
    AdminProductRow,
  ],
  templateUrl: './admin-stocks.html',
  styleUrl: './admin-stocks.scss',
})
export class AdminStocks implements OnInit {
  private readonly adminProductService = inject(AdminProductService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly creatingProduct = signal(false);
  protected readonly createProductError = signal<string | null>(null);

  protected readonly newProduct = signal<NewProduct>({ name: '', initialStock: 0 });

  protected readonly newProductForm = form(
    this.newProduct,
    (path) => {
      required(path.name, { message: 'Le nom du produit est requis.' });
    },
    {
      submission: {
        action: async () => {
          this.createProductError.set(null);
          this.creatingProduct.set(true);

          try {
            const product = await firstValueFrom(
              this.adminProductService.createProduct(this.newProduct()),
            );
            this.products.update((products) => [...products, product]);
            this.newProduct.set({ name: '', initialStock: 0 });
          } catch (error) {
            this.createProductError.set(this.extractErrorMessage(error));
          } finally {
            this.creatingProduct.set(false);
          }

          return undefined;
        },
      },
    },
  );

  ngOnInit(): void {
    this.loadProducts();
  }

  protected setInitialStock(initialStock: number): void {
    this.newProduct.update((product) => ({ ...product, initialStock }));
  }

  protected onProductUpdated(updated: Product): void {
    this.products.update((products) =>
      products.map((product) => (product.id === updated.id ? updated : product)),
    );
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  private async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const products = await firstValueFrom(this.adminProductService.getAllProducts());
      this.products.set(products);
    } catch {
      this.loadError.set('Impossible de charger les produits.');
    } finally {
      this.loading.set(false);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return 'Impossible de créer ce produit.';
  }
}
