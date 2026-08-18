import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin/stocks',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin/orders',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin/analytics',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin/users',
    renderMode: RenderMode.Client,
  },
  {
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'register',
    renderMode: RenderMode.Client,
  },
  {
    path: 'forgot-password',
    renderMode: RenderMode.Client,
  },
  {
    path: 'reset-password',
    renderMode: RenderMode.Client,
  },
  {
    path: 'verify-email',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
