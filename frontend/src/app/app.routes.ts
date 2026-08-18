import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { NosGyozas } from './pages/nos-gyozas/nos-gyozas';
import { APropos } from './pages/a-propos/a-propos';
import { Contact } from './pages/contact/contact';
import { Checkout } from './pages/checkout/checkout';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'nos-gyozas', component: NosGyozas },
  { path: 'a-propos', component: APropos },
  { path: 'contact', component: Contact },
  { path: 'checkout', component: Checkout },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./pages/admin/admin-login/admin-login').then((m) => m.AdminLogin),
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
];
