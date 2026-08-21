import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FreshAvailability } from '../models/fresh-availability.model';

@Injectable({ providedIn: 'root' })
export class FreshAvailabilityService {
  private readonly http = inject(HttpClient);

  getCurrent(): Observable<FreshAvailability> {
    return this.http.get<FreshAvailability>('/api/fresh-availability');
  }
}
