export interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  referenceUnitPrice: number | null;
  lastPurchaseDate: string | null;
}
