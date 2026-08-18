import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  let authService: { isAuthenticated: ReturnType<typeof vi.fn> };
  let router: { parseUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { isAuthenticated: vi.fn() };
    router = { parseUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('allows navigation when the admin is authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);

    expect(runGuard()).toBe(true);
  });

  it('redirects to /admin/login when not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);
    const redirectTree = {} as UrlTree;
    router.parseUrl.mockReturnValue(redirectTree);

    const result = runGuard();

    expect(router.parseUrl).toHaveBeenCalledWith('/admin/login');
    expect(result).toBe(redirectTree);
  });
});
