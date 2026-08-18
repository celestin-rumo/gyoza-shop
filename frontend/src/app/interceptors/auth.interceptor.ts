import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

const ADMIN_API_PREFIX = '/api/admin';

/**
 * Adds the admin token to `/api/admin/**` calls and automatically logs out
 * if the backend responds with 401/403 (expired or invalid token).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(ADMIN_API_PREFIX)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.token();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        authService.logout();
        router.navigateByUrl('/admin/login');
      }

      return throwError(() => error);
    }),
  );
};
