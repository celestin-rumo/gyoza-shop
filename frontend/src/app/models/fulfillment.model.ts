export type FulfillmentMethod = 'PICKUP' | 'DELIVERY';
export type ContentType = 'FRESH' | 'FROZEN';

export const FULFILLMENT_METHOD_LABELS: Record<FulfillmentMethod, string> = {
  PICKUP: 'Retrait',
  DELIVERY: 'Livraison',
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  FRESH: 'Frais',
  FROZEN: 'Surgelé',
};

/** "16:00:00" / "18:00:00" (or "16:00") → "16h00–18h00". */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)}–${formatTime(endTime)}`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
}
