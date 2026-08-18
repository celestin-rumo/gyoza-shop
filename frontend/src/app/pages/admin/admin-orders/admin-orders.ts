import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AdminOrderService } from '../../../services/admin-order.service';
import { AuthService } from '../../../services/auth.service';
import { Order, OrderStatus } from '../../../models/order.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';
import { DsPricePipe } from '../../../design-system/pipes/ds-price.pipe';

const STATUS_LABELS: Record<OrderStatus, string> = {
  RESERVED: 'Réservée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

/** Mirrors `Order.canTransitionTo` on the backend, so only valid actions are shown. */
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  RESERVED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const ALL_STATUSES: OrderStatus[] = ['RESERVED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];

type StatusFilter = OrderStatus | 'ALL';

const PAGE_SIZE = 8;

interface PrepPack {
  packSize: number;
  packQuantity: number;
}

interface PrepProduct {
  productName: string;
  totalUnits: number;
  packs: PrepPack[];
}

@Component({
  selector: 'app-admin-orders',
  imports: [DsSectionHeaderComponent, DsButtonComponent, DsPricePipe, DatePipe, RouterLink],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.scss',
})
export class AdminOrders implements OnInit {
  private readonly adminOrderService = inject(AdminOrderService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly allStatuses = ALL_STATUSES;

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly updatingOrderId = signal<number | null>(null);
  protected readonly statusErrors = signal<Record<number, string>>({});

  protected readonly statusFilter = signal<StatusFilter>('ALL');
  protected readonly expandedOrderIds = signal<ReadonlySet<number>>(new Set());
  protected readonly currentPage = signal(1);

  protected readonly filteredOrders = computed(() => {
    const filter = this.statusFilter();

    if (filter === 'ALL') {
      return this.orders();
    }

    return this.orders().filter((order) => order.status === filter);
  });

  protected readonly reservedOrders = computed(() =>
    this.orders().filter((order) => order.status === 'RESERVED'),
  );

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredOrders().length / PAGE_SIZE)),
  );

  protected readonly pagedOrders = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredOrders().slice(start, start + PAGE_SIZE);
  });

  protected readonly orderCounts = computed(() => {
    const counts: Partial<Record<OrderStatus, number>> = {};

    for (const order of this.orders()) {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
    }

    return counts;
  });

  /** Total packs (by size) to prepare for each product, based on reserved orders. */
  protected readonly prepSummary = computed<PrepProduct[]>(() => {
    const packsByProduct = new Map<string, Map<number, number>>();

    for (const order of this.reservedOrders()) {
      for (const item of order.items) {
        const sizes = packsByProduct.get(item.productName) ?? new Map<number, number>();
        sizes.set(item.packSize, (sizes.get(item.packSize) ?? 0) + item.packQuantity);
        packsByProduct.set(item.productName, sizes);
      }
    }

    return Array.from(packsByProduct.entries())
      .map(([productName, sizes]) => {
        const packs = Array.from(sizes.entries())
          .map(([packSize, packQuantity]) => ({ packSize, packQuantity }))
          .sort((a, b) => a.packSize - b.packSize);

        const totalUnits = packs.reduce((sum, pack) => sum + pack.packSize * pack.packQuantity, 0);

        return { productName, totalUnits, packs };
      })
      .sort((a, b) => a.productName.localeCompare(b.productName, 'fr'));
  });

  constructor() {
    // Safety net: if the current page becomes out of bounds (e.g. the last order
    // on a page changes status and drops out of the visible list), clamp it back.
    effect(() => {
      const total = this.totalPages();

      if (this.currentPage() > total) {
        this.currentPage.set(total);
      }
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  protected nextStatuses(status: OrderStatus): OrderStatus[] {
    return NEXT_STATUSES[status];
  }

  protected statusErrorFor(orderId: number): string | null {
    return this.statusErrors()[orderId] ?? null;
  }

  protected countFor(status: OrderStatus): number {
    return this.orderCounts()[status] ?? 0;
  }

  protected setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  protected isExpanded(orderId: number): boolean {
    return this.expandedOrderIds().has(orderId);
  }

  protected toggleExpanded(orderId: number): void {
    this.expandedOrderIds.update((ids) => {
      const next = new Set(ids);

      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }

      return next;
    });
  }

  protected async setStatus(order: Order, status: OrderStatus): Promise<void> {
    this.updatingOrderId.set(order.id);
    this.clearStatusError(order.id);

    try {
      const updated = await firstValueFrom(
        this.adminOrderService.updateStatus(order.id, status),
      );
      this.orders.update((orders) =>
        orders.map((existing) => (existing.id === updated.id ? updated : existing)),
      );
    } catch (error) {
      this.setStatusError(order.id, this.extractErrorMessage(error));
    } finally {
      this.updatingOrderId.set(null);
    }
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }

  private setStatusError(orderId: number, message: string): void {
    this.statusErrors.update((errors) => ({ ...errors, [orderId]: message }));
  }

  private clearStatusError(orderId: number): void {
    this.statusErrors.update((errors) => {
      if (!(orderId in errors)) {
        return errors;
      }

      const next = { ...errors };
      delete next[orderId];
      return next;
    });
  }

  private async loadOrders(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const orders = await firstValueFrom(this.adminOrderService.getAllOrders());
      this.orders.set(orders);
    } catch {
      this.loadError.set('Impossible de charger les commandes.');
    } finally {
      this.loading.set(false);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return 'Impossible de mettre à jour cette commande.';
  }
}
