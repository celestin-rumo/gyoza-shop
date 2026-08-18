import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Analytics, AnalyticsTimeSeries } from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private readonly http = inject(HttpClient);

  getAnalytics(): Observable<Analytics> {
    return this.http.get<Analytics>('/api/admin/analytics');
  }

  /** `startDate`/`endDate` en "yyyy-MM-dd" ; sans elles, l'API renvoie les 30 derniers jours. */
  getTimeSeries(startDate?: string, endDate?: string): Observable<AnalyticsTimeSeries> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }

    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<AnalyticsTimeSeries>('/api/admin/analytics/timeseries', { params });
  }
}
