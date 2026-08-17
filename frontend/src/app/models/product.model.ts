import { Pack } from './pack.model';

export interface Product {
  id: number;
  name: string;
  stockQuantity: number;
  active: boolean;
  packs: Pack[];
}