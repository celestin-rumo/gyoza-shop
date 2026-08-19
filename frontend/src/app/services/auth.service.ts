import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';

export type Role = 'CUSTOMER' | 'ADMIN';

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  street: string;
  postalCode: string;
  city: string;
  role: Role;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  street: string;
  postalCode: string;
  city: string;
  email: string;
  password: string;
}

/**
 * Authentication state: the backend sets an HttpOnly session cookie on login,
 * which is the actual source of truth and isn't readable from JS. `currentUser`
 * is just a client-side cache, hydrated once at startup via `refreshMe()`
 * (see the app initializer in app.config.ts) and kept in sync on login/logout.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _currentUser = signal<CurrentUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  register(payload: RegisterPayload): Observable<void> {
    return this.http.post<void>('/api/auth/register', payload);
  }

  login(email: string, password: string): Observable<CurrentUser> {
    return this.http
      .post<CurrentUser>('/api/auth/login', { email, password })
      .pipe(tap((user) => this._currentUser.set(user)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>('/api/auth/logout', {})
      .pipe(tap(() => this._currentUser.set(null)));
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>('/api/auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>('/api/auth/reset-password', { token, newPassword });
  }

  verifyEmail(token: string): Observable<void> {
    return this.http.get<void>('/api/auth/verify-email', { params: { token } });
  }

  /** Re-derives `currentUser` from the session cookie; used once at app startup. */
  refreshMe(): Observable<CurrentUser | null> {
    return this.http.get<CurrentUser>('/api/users/me').pipe(
      tap((user) => this._currentUser.set(user)),
      catchError(() => {
        this._currentUser.set(null);
        return of(null);
      }),
    );
  }
}
