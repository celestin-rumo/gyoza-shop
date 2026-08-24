export type PurchaseSource = 'MANUAL' | 'SCANNED';

export interface RawMaterialPurchase {
  id: number;
  rawMaterialId: number;
  rawMaterialName: string;
  date: string;
  quantityPurchased: number;
  totalPricePaid: number;
  unitPrice: number;
  source: PurchaseSource;
  originCountry: string;
  store: string;
  batchNumber: string | null;
}
