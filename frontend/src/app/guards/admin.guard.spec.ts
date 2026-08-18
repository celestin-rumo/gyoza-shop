import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  let authService: { isAdmin: ReturnType<typeof vi.fn> };
  let router: { parseUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { isAdmin: vi.fn() };
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

  it('allows navigation when the current user is an admin', () => {
    authService.isAdmin.mockReturnValue(true);

    expect(runGuard()).toBe(true);
  });

  it('redirects to /login when the current user is not an admin', () => {
    authService.isAdmin.mockReturnValue(false);
    const redirectTree = {} as UrlTree;
    router.parseUrl.mockReturnValue(redirectTree);

    const result = runGuard();

    expect(router.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).toBe(redirectTree);
  });
});
