import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { NosGyozas } from './pages/nos-gyozas/nos-gyozas';
import { APropos } from './pages/a-propos/a-propos';
import { Contact } from './pages/contact/contact';
import { Checkout } from './pages/checkout/checkout';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'nos-gyozas', component: NosGyozas },
  { path: 'a-propos', component: APropos },
  { path: 'contact', component: Contact },
  { path: 'checkout', component: Checkout },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'account',
    loadComponent: () => import('./pages/account/account').then((m) => m.Account),
    canActivate: [authGuard],
  },
  {
    path: 'my-orders',
    loadComponent: () => import('./pages/my-orders/my-orders').then((m) => m.MyOrders),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin-home/admin-home').then((m) => m.AdminHome),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/stocks',
    loadComponent: () =>
      import('./pages/admin/admin-stocks/admin-stocks').then((m) => m.AdminStocks),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/orders',
    loadComponent: () =>
      import('./pages/admin/admin-orders/admin-orders').then((m) => m.AdminOrders),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/slots',
    loadComponent: () =>
      import('./pages/admin/admin-slots/admin-slots').then((m) => m.AdminSlots),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/analytics',
    loadComponent: () =>
      import('./pages/admin/admin-analytics/admin-analytics').then((m) => m.AdminAnalytics),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/users',
    loadComponent: () =>
      import('./pages/admin/admin-users/admin-users').then((m) => m.AdminUsers),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/raw-materials',
    loadComponent: () =>
      import('./pages/admin/admin-raw-materials/admin-raw-materials').then(
        (m) => m.AdminRawMaterials,
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/production-sessions',
    loadComponent: () =>
      import('./pages/admin/admin-production-sessions/admin-production-sessions').then(
        (m) => m.AdminProductionSessions,
      ),
    canActivate: [adminGuard],
  },
];
