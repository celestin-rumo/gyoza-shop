import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

const TOKEN_STORAGE_KEY = 'gyoza_admin_token';

interface LoginResponse {
  token: string;
}

/**
 * Session admin : jeton opaque obtenu via `/api/auth/login`, gardé en `sessionStorage`
 * (effacé à la fermeture de l'onglet) et rejoué sur chaque appel `/api/admin/**`
 * par `authInterceptor`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _token = signal<string | null>(this.readStoredToken());

  readonly isAuthenticated = computed(() => this._token() !== null);

  token(): string | null {
    return this._token();
  }

  login(username: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { username, password })
      .pipe(
        tap((response) => this.setToken(response.token)),
        map(() => undefined),
      );
  }

  logout(): void {
    this.setToken(null);
  }

  private setToken(token: string | null): void {
    this._token.set(token);

    if (!this.isBrowser) {
      return;
    }

    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  private readStoredToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }
}
