import { ContentType, FulfillmentMethod } from './fulfillment.model';

export interface SlotAvailability {
  id: number;
  date: string;
  fulfillmentMethod: FulfillmentMethod;
  startTime: string;
  endTime: string;
  contentType: ContentType;
  open: boolean;
}

export interface CreateSlotAvailabilityRequest {
  date: string;
  fulfillmentMethod: FulfillmentMethod;
  startTime: string;
  endTime: string;
  contentType: ContentType;
}
