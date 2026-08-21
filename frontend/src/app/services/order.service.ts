import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DsCartAddEvent } from '../design-system';
import { Order } from '../models/order.model';
import { ContentType, FulfillmentMethod } from '../models/fulfillment.model';

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  address?: string;
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
  fulfillmentMethod: FulfillmentMethod;
  slot: string;
  contentType: ContentType;
}

export interface OrderFulfillment {
  fulfillmentMethod: FulfillmentMethod;
  slot: string;
  contentType: ContentType;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  placeOrder(
    customer: OrderCustomer,
    lines: DsCartAddEvent[],
    fulfillment: OrderFulfillment,
  ): Observable<OrderResponse> {

    const request: OrderRequest = {
      customer,
      lines: lines.map((line) => ({
        packId: Number(line.pack.id),
        quantity: line.quantity,
      })),
      fulfillmentMethod: fulfillment.fulfillmentMethod,
      slot: fulfillment.slot,
      contentType: fulfillment.contentType,
    };

    return this.http.post<OrderResponse>(
      '/api/orders',
      request
    );
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/mine');
  }
}