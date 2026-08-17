import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DsCartAddEvent } from './design-system';

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
}

export interface OrderLineRequest {
  productId: string;
  productName: string;
  packId: string;
  packLabel: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderRequest {
  customer: OrderCustomer;
  lines: OrderLineRequest[];
  subtotal: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  placeOrder(customer: OrderCustomer, lines: DsCartAddEvent[], subtotal: number): Observable<void> {
    const request: OrderRequest = {
      customer,
      subtotal,
      lines: lines.map((line) => ({
        productId: line.product.id,
        productName: line.product.name,
        packId: line.pack.id,
        packLabel: line.pack.label,
        quantity: line.quantity,
        unitPrice: line.pack.price,
      })),
    };

    return this.http.post<void>('/api/orders', request);
  }
}
