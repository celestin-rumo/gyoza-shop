import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { NosGyozas } from './pages/nos-gyozas/nos-gyozas';
import { Contact } from './pages/contact/contact';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'nos-gyozas', component: NosGyozas },
  { path: 'contact', component: Contact },
];
