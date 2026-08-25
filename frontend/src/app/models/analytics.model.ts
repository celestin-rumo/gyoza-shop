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

export interface SessionCostPoint {
  date: string;
  batchNumber: string;
  materialCost: number;
  netProfit: number;
  /** "Réel" — only counts delivered orders, unlike netProfit's frozen théorique estimate. */
  actualNetProfit: number;
}

export interface ProductionAnalytics {
  totalMaterialCost: number;
  totalNetProfit: number;
  averageMaterialCostPerGyoza: number;
  /** Flavor name -> average cost/gyoza across every session that produced it. */
  averageCostPerGyozaByFlavor: Record<string, number>;
  /** "Réel" totals — only counts orders that reached DELIVERED. */
  totalActualRevenue: number;
  totalActualNetProfit: number;
  sessions: SessionCostPoint[];
}
