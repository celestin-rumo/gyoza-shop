import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { OrderService } from '../../services/order.service';
import { Order, OrderStatus } from '../../models/order.model';
import { FulfillmentMethod, formatTimeRange } from '../../models/fulfillment.model';
import { DsSectionHeaderComponent } from '../../design-system/components/ds-section-header/ds-section-header.component';
import { DsFormMessageComponent } from '../../design-system/components/ds-form-message/ds-form-message.component';
import { DsPricePipe } from '../../design-system/pipes/ds-price.pipe';

const STATUS_LABELS: Record<OrderStatus, string> = {
  RESERVED: 'Réservée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const FULFILLMENT_LABELS: Record<FulfillmentMethod, string> = {
  PICKUP: 'Retrait',
  DELIVERY: 'Livraison',
};

@Component({
  selector: 'app-my-orders',
  imports: [DsSectionHeaderComponent, DsFormMessageComponent, DsPricePipe, DatePipe, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders implements OnInit {
  private readonly orderService = inject(OrderService);

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly fulfillmentLabels = FULFILLMENT_LABELS;
  protected readonly formatTimeRange = formatTimeRange;

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  private async loadOrders(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const orders = await firstValueFrom(this.orderService.getMyOrders());
      this.orders.set(orders);
    } catch {
      this.loadError.set('Impossible de charger tes commandes.');
    } finally {
      this.loading.set(false);
    }
  }
}
