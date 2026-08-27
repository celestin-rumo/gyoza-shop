import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Order, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private readonly http = inject(HttpClient);

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/admin/orders');
  }

  updateStatus(orderId: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`/api/admin/orders/${orderId}/status`, { status });
  }

  validateItemBatch(orderId: number, itemId: number, validated: boolean): Observable<Order> {
    return this.http.patch<Order>(`/api/admin/orders/${orderId}/items/${itemId}/batch-validation`, {
      validated,
    });
  }
}
