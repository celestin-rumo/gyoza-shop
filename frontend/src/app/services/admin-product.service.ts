import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { CatalogService } from './catalog.service';
import { Product } from '../models/product.model';
import { Pack } from '../models/pack.model';

export interface CreateProductPayload {
  name: string;
  initialStock: number;
}

export interface PackPayload {
  size: number;
  price: number;
}

/** A production batch (ProductOutput) still holding stock for a product, oldest first. */
export interface ProductLot {
  productOutputId: number;
  batchNumber: string;
  date: string;
  remainingQuantity: number;
}

/**
 * Admin calls (protected by session + role, see `adminGuard`/`SecurityConfig`). Each mutation
 * also refreshes `CatalogService` so the homepage and "Our gyozas" reflect the change.
 */
@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private readonly http = inject(HttpClient);
  private readonly catalog = inject(CatalogService);

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/admin/products');
  }

  createProduct(payload: CreateProductPayload): Observable<Product> {
    return this.http
      .post<Product>('/api/admin/products', payload)
      .pipe(tap(() => this.catalog.refresh()));
  }

  addStock(productId: number, quantity: number): Observable<Product> {
    return this.http
      .post<Product>(`/api/admin/products/${productId}/stock`, { quantity })
      .pipe(tap(() => this.catalog.refresh()));
  }

  getLots(productId: number): Observable<ProductLot[]> {
    return this.http.get<ProductLot[]>(`/api/admin/products/${productId}/lots`);
  }

  removeStockFromLot(
    productId: number,
    productOutputId: number,
    quantity: number,
  ): Observable<Product> {
    return this.http
      .post<Product>(`/api/admin/products/${productId}/stock/remove-from-lot`, {
        productOutputId,
        quantity,
      })
      .pipe(tap(() => this.catalog.refresh()));
  }

  setActive(productId: number, active: boolean): Observable<Product> {
    return this.http
      .patch<Product>(`/api/admin/products/${productId}/status`, { active })
      .pipe(tap(() => this.catalog.refresh()));
  }

  addPack(productId: number, payload: PackPayload): Observable<Pack> {
    return this.http
      .post<Pack>(`/api/admin/products/${productId}/packs`, payload)
      .pipe(tap(() => this.catalog.refresh()));
  }

  updatePack(packId: number, payload: PackPayload): Observable<Pack> {
    return this.http
      .put<Pack>(`/api/admin/packs/${packId}`, payload)
      .pipe(tap(() => this.catalog.refresh()));
  }

  deletePack(packId: number): Observable<void> {
    return this.http
      .delete<void>(`/api/admin/packs/${packId}`)
      .pipe(tap(() => this.catalog.refresh()));
  }
}
