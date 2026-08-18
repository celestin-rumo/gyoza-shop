import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: { token: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { token: vi.fn(), logout: vi.fn() };
    router = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds the Authorization header on /api/admin/** calls when a token is present', () => {
    authService.token.mockReturnValue('secret-token');

    httpClient.get('/api/admin/orders').subscribe();

    const req = httpMock.expectOne('/api/admin/orders');
    expect(req.request.headers.get('Authorization')).toBe('Bearer secret-token');
    req.flush({});
  });

  it('does not add the Authorization header on non-admin calls', () => {
    authService.token.mockReturnValue('secret-token');

    httpClient.get('/api/products').subscribe();

    const req = httpMock.expectOne('/api/products');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('logs out and redirects to /admin/login on a 401 response', () => {
    authService.token.mockReturnValue('expired-token');

    httpClient.get('/api/admin/orders').subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/api/admin/orders');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/login');
  });

  it('logs out and redirects to /admin/login on a 403 response', () => {
    authService.token.mockReturnValue('some-token');

    httpClient.get('/api/admin/orders').subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/api/admin/orders');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/login');
  });
});
