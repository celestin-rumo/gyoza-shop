export interface RawMaterialUsage {
  rawMaterialId: number;
  rawMaterialName: string;
  unit: string;
  quantityUsed: number;
  /** Last-known purchase unit price, frozen at session creation. */
  unitCost: number;
  /** unitCost x quantityUsed. */
  lineCost: number;
  /** Flavor this usage line is for; null means it's shared across every output. */
  targetProductId: number | null;
  targetProductName: string | null;
}

export interface SessionParticipant {
  userId: string;
  userName: string;
}

export interface ProductOutput {
  productId: number;
  productName: string;
  quantityProduced: number;
  /** Average pack sale price per unit, frozen at session creation. */
  unitSalePrice: number;
  /** unitSalePrice x quantityProduced. */
  revenue: number;
  /** Raw material cost attributed to this flavor (direct + prorated shared ingredients). */
  materialCost: number;
  costPerGyoza: number;
  /** Gyoza from this batch sold via a DELIVERED order — "réel", not the théorique estimate. */
  unitsSold: number;
  unitsRemaining: number;
  actualRevenue: number;
}

export interface ProductionSessionCostSummary {
  totalMaterialCost: number;
  totalGyozaProduced: number;
  materialCostPerGyoza: number;
  /** Cumulated person-hours (e.g. 2 people x 2h = 4h). */
  totalSessionHours: number;
  timePerGyoza: number;
  theoreticalRevenue: number;
  grossProfit: number;
  otherCosts: number;
  netProfit: number;
  hourlyRevenue: number;
  /** Net profit / cost basis x 100; null when the cost basis is 0. */
  roi: number | null;
}

/**
 * "Réel" figures — only counts orders that reached DELIVERED, unlike
 * ProductionSessionCostSummary's frozen catalog-based théorique estimate. Live: it changes as
 * orders are delivered after the session was created.
 */
export interface ProductionSessionActualSummary {
  unitsSold: number;
  unitsRemaining: number;
  actualRevenue: number;
  actualGrossProfit: number;
  actualNetProfit: number;
  actualHourlyRevenue: number;
  actualRoi: number | null;
}

export interface ProductionSession {
  id: number;
  date: string;
  /** Lot/batch traceability code, e.g. "L20260825-01" — see ProductionSessionServiceImpl. */
  batchNumber: string;
  /** Total time the whole session took, shared by every participant. */
  durationHours: number;
  notes: string | null;
  /** Free-form additional costs (packaging, transport, ...), editable after creation. */
  otherCosts: number;
  rawMaterialUsages: RawMaterialUsage[];
  participants: SessionParticipant[];
  outputs: ProductOutput[];
  costSummary: ProductionSessionCostSummary;
  actualSummary: ProductionSessionActualSummary;
}
