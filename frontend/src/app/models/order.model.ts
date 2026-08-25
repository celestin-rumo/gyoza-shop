import { ContentType, FulfillmentMethod } from './fulfillment.model';

export type OrderStatus = 'RESERVED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
}

export interface OrderItemBatch {
  /** Null when this quantity came from stock not traceable to any production session. */
  batchNumber: string | null;
  quantity: number;
}

export interface OrderItem {
  id: number;
  productName: string;
  packSize: number;
  packQuantity: number;
  unitPackPrice: number;
  /** Manually confirmed by whoever preps the order — required before the order can reach READY. */
  batchValidated: boolean;
  batches: OrderItemBatch[];
}

export interface Order {
  id: number;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  customer: OrderCustomer;
  items: OrderItem[];
  fulfillmentMethod: FulfillmentMethod;
  date: string;
  startTime: string;
  endTime: string;
  contentType: ContentType;
}
