import { OrderStatus } from './order.model';

export interface Analytics {
  totalCustomers: number;
  newCustomersLastWeek: number;
  totalOrders: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  averageOrderValue: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  totalRevenue: number;
}

export interface AnalyticsDayPoint {
  date: string;
  revenue: number;
  orderCount: number;
  newCustomerCount: number;
  unitsByProduct: Record<string, number>;
}

export interface AnalyticsTimeSeries {
  days: AnalyticsDayPoint[];
}
