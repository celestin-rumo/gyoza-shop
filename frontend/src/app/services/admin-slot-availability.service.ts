import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateSlotAvailabilityRequest, SlotAvailability } from '../models/slot-availability.model';

@Injectable({ providedIn: 'root' })
export class AdminSlotAvailabilityService {
  private readonly http = inject(HttpClient);

  getAllSlots(): Observable<SlotAvailability[]> {
    return this.http.get<SlotAvailability[]>('/api/admin/slots');
  }

  createSlot(request: CreateSlotAvailabilityRequest): Observable<SlotAvailability> {
    return this.http.post<SlotAvailability>('/api/admin/slots', request);
  }

  updateSlot(slotId: number, request: CreateSlotAvailabilityRequest): Observable<SlotAvailability> {
    return this.http.put<SlotAvailability>(`/api/admin/slots/${slotId}`, request);
  }

  setOpen(slotId: number, open: boolean): Observable<SlotAvailability> {
    return this.http.patch<SlotAvailability>(`/api/admin/slots/${slotId}/status`, { open });
  }

  moveDate(slotId: number, date: string): Observable<SlotAvailability> {
    return this.http.patch<SlotAvailability>(`/api/admin/slots/${slotId}/date`, { date });
  }

  deleteSlot(slotId: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/slots/${slotId}`);
  }
}
