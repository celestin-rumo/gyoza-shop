import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DsCartAddEvent } from '../design-system';

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
}

export interface OrderResponse {
  id: number;
  status: string;
  totalPrice: number;
  createdAt: string;
}

export interface OrderLineRequest {
  packId: number;
  quantity: number;
}

export interface OrderRequest {
  customer: OrderCustomer;
  lines: OrderLineRequest[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  placeOrder(
    customer: OrderCustomer,
    lines: DsCartAddEvent[],
  ): Observable<OrderResponse> {

    const request: OrderRequest = {
      customer,
      lines: lines.map((line) => ({
        packId: Number(line.pack.id),
        quantity: line.quantity,
      })),
    };

    return this.http.post<OrderResponse>(
      '/api/orders',
      request
    );
  }
}