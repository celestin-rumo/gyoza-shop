export type FulfillmentMethod = 'PICKUP' | 'DELIVERY';
export type ContentType = 'FRESH' | 'FROZEN';

export type PickupSlot =
  | 'MERCREDI_16H_18H'
  | 'JEUDI_10H_12H'
  | 'VENDREDI_16H_18H'
  | 'SAMEDI_10H_12H'
  | 'SAMEDI_14H_16H';

export type DeliverySlot =
  | 'MARDI_18H_20H'
  | 'MERCREDI_18H_20H'
  | 'JEUDI_18H_20H'
  | 'VENDREDI_18H_20H'
  | 'SAMEDI_09H_11H';

export interface SlotOption {
  value: string;
  label: string;
}

// Placeholder slots — rename/replace the labels below to change what
// customers see (values must keep matching the backend's PickupSlot/DeliverySlot enums).
export const PICKUP_SLOTS: SlotOption[] = [
  { value: 'MERCREDI_16H_18H', label: 'Mercredi 16h–18h' },
  { value: 'JEUDI_10H_12H', label: 'Jeudi 10h–12h' },
  { value: 'VENDREDI_16H_18H', label: 'Vendredi 16h–18h' },
  { value: 'SAMEDI_10H_12H', label: 'Samedi 10h–12h' },
  { value: 'SAMEDI_14H_16H', label: 'Samedi 14h–16h' },
];

export const DELIVERY_SLOTS: SlotOption[] = [
  { value: 'MARDI_18H_20H', label: 'Mardi 18h–20h' },
  { value: 'MERCREDI_18H_20H', label: 'Mercredi 18h–20h' },
  { value: 'JEUDI_18H_20H', label: 'Jeudi 18h–20h' },
  { value: 'VENDREDI_18H_20H', label: 'Vendredi 18h–20h' },
  { value: 'SAMEDI_09H_11H', label: 'Samedi 9h–11h' },
];

export const FULFILLMENT_METHOD_LABELS: Record<FulfillmentMethod, string> = {
  PICKUP: 'Retrait',
  DELIVERY: 'Livraison',
};

export function slotsFor(method: FulfillmentMethod): SlotOption[] {
  return method === 'PICKUP' ? PICKUP_SLOTS : DELIVERY_SLOTS;
}

export function slotLabel(method: FulfillmentMethod, slot: string): string {
  return slotsFor(method).find((option) => option.value === slot)?.label ?? slot;
}
