import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FreshAvailability } from '../models/fresh-availability.model';

export interface UpdateFreshAvailabilityRequest {
  nextBatchDate: string;
  orderWindowOpen: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminFreshAvailabilityService {
  private readonly http = inject(HttpClient);

  getCurrent(): Observable<FreshAvailability> {
    return this.http.get<FreshAvailability>('/api/fresh-availability');
  }

  update(request: UpdateFreshAvailabilityRequest): Observable<FreshAvailability> {
    return this.http.put<FreshAvailability>('/api/admin/fresh-availability', request);
  }
}
