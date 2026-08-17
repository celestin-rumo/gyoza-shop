import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { NosGyozas } from './pages/nos-gyozas/nos-gyozas';
import { APropos } from './pages/a-propos/a-propos';
import { Contact } from './pages/contact/contact';
import { Checkout } from './pages/checkout/checkout';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'nos-gyozas', component: NosGyozas },
  { path: 'a-propos', component: APropos },
  { path: 'contact', component: Contact },
  { path: 'checkout', component: Checkout },
];
