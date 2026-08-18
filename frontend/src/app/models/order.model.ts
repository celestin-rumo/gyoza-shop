export type OrderStatus = 'RESERVED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
}

export interface OrderItem {
  productName: string;
  packSize: number;
  packQuantity: number;
  unitPackPrice: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  customer: OrderCustomer;
  items: OrderItem[];
}
