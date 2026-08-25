export interface RawMaterialUsage {
  rawMaterialId: number;
  rawMaterialName: string;
  unit: string;
  quantityUsed: number;
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  hoursSpent: number;
}

export interface ProductOutput {
  productId: number;
  productName: string;
  quantityProduced: number;
}

export interface ProductionSession {
  id: number;
  date: string;
  /** Lot/batch traceability code, e.g. "L20260825-01" — see ProductionSessionServiceImpl. */
  batchNumber: string;
  notes: string | null;
  rawMaterialUsages: RawMaterialUsage[];
  participants: SessionParticipant[];
  outputs: ProductOutput[];
}
