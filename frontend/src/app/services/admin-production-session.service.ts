import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { CatalogService } from './catalog.service';
import { ProductionSession } from '../models/production-session.model';

export interface CreateRawMaterialUsagePayload {
  rawMaterialId: number;
  quantityUsed: number;
  targetProductId?: number | null;
}

export interface CreateSessionParticipantPayload {
  userId: string;
}

export interface CreateProductOutputPayload {
  productId: number;
  quantityProduced: number;
}

export interface CreateProductionSessionPayload {
  date: string;
  durationHours: number;
  notes: string | null;
  otherCosts?: number | null;
  rawMaterialUsages: CreateRawMaterialUsagePayload[];
  participants: CreateSessionParticipantPayload[];
  outputs: CreateProductOutputPayload[];
}

/**
 * Admin calls (protected by session + role, see `adminGuard`/`SecurityConfig`). Creating a
 * session increments product stock server-side, so it also refreshes `CatalogService` —
 * same reasoning as `AdminProductService`.
 */
@Injectable({ providedIn: 'root' })
export class AdminProductionSessionService {
  private readonly http = inject(HttpClient);
  private readonly catalog = inject(CatalogService);

  getAllSessions(): Observable<ProductionSession[]> {
    return this.http.get<ProductionSession[]>('/api/admin/production-sessions');
  }

  getSession(id: number): Observable<ProductionSession> {
    return this.http.get<ProductionSession>(`/api/admin/production-sessions/${id}`);
  }

  createSession(payload: CreateProductionSessionPayload): Observable<ProductionSession> {
    return this.http
      .post<ProductionSession>('/api/admin/production-sessions', payload)
      .pipe(tap(() => this.catalog.refresh()));
  }

  updateOtherCosts(id: number, otherCosts: number): Observable<ProductionSession> {
    return this.http.patch<ProductionSession>(`/api/admin/production-sessions/${id}/other-costs`, {
      otherCosts,
    });
  }

  updateDetails(id: number, notes: string | null, durationHours: number): Observable<ProductionSession> {
    return this.http.patch<ProductionSession>(`/api/admin/production-sessions/${id}/details`, {
      notes,
      durationHours,
    });
  }
}
