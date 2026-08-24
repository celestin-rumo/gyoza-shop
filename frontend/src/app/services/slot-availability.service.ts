import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SlotAvailability } from '../models/slot-availability.model';

@Injectable({ providedIn: 'root' })
export class SlotAvailabilityService {
  private readonly http = inject(HttpClient);

  getOpenSlots(): Observable<SlotAvailability[]> {
    return this.http.get<SlotAvailability[]>('/api/slots');
  }
}
