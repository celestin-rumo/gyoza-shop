import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RawMaterial } from '../models/raw-material.model';
import { PurchaseSource, RawMaterialPurchase } from '../models/raw-material-purchase.model';

export interface RawMaterialPayload {
  name: string;
  unit: string;
}

export interface CreateRawMaterialPurchasePayload {
  rawMaterialId: number;
  date: string;
  quantityPurchased: number;
  totalPricePaid: number;
  source: PurchaseSource;
  originCountry: string;
  store: string;
  batchNumber: string | null;
}

/** Admin calls (protected by session + role, see `adminGuard`/`SecurityConfig`). */
@Injectable({ providedIn: 'root' })
export class AdminRawMaterialService {
  private readonly http = inject(HttpClient);

  getAllRawMaterials(): Observable<RawMaterial[]> {
    return this.http.get<RawMaterial[]>('/api/admin/raw-materials');
  }

  createRawMaterial(payload: RawMaterialPayload): Observable<RawMaterial> {
    return this.http.post<RawMaterial>('/api/admin/raw-materials', payload);
  }

  updateRawMaterial(rawMaterialId: number, payload: RawMaterialPayload): Observable<RawMaterial> {
    return this.http.put<RawMaterial>(`/api/admin/raw-materials/${rawMaterialId}`, payload);
  }

  deleteRawMaterial(rawMaterialId: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/raw-materials/${rawMaterialId}`);
  }

  getPurchases(rawMaterialId?: number): Observable<RawMaterialPurchase[]> {
    return this.http.get<RawMaterialPurchase[]>('/api/admin/raw-material-purchases', {
      params: rawMaterialId != null ? { rawMaterialId } : {},
    });
  }

  createPurchase(payload: CreateRawMaterialPurchasePayload): Observable<RawMaterialPurchase> {
    return this.http.post<RawMaterialPurchase>('/api/admin/raw-material-purchases', payload);
  }
}
