import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Role } from './auth.service';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  /** True for the account seeded from ADMIN_EMAIL — its role can't be changed. */
  primaryAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);

  getAdmins(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>('/api/admin/users', { params: { role: 'ADMIN' } });
  }

  updateRole(email: string, role: Role): Observable<AdminUser> {
    return this.http.put<AdminUser>('/api/admin/users/role', { email, role });
  }
}
