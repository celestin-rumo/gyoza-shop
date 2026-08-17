import { Component } from '@angular/core';
import {
  DsFooterComponent,
  DsNavbarComponent,
  DsNavLink,
  DsSectionHeaderComponent,
} from '../../design-system';

@Component({
  selector: 'app-contact',
  imports: [DsNavbarComponent, DsSectionHeaderComponent, DsFooterComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  protected readonly navLinks: DsNavLink[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Nos gyozas', href: '/#gyozas' },
    { label: 'À propos', href: '/#a-propos' },
    { label: 'Contact', href: '/contact', active: true },
  ];

  protected readonly address = 'Chemin de la Pudressa 35, 1731 Ependes';
  protected readonly email = 'admin@celestinrumo.ch';
  protected readonly phone = '+41 76 433 28 94';

  protected readonly mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.address)}`;
  protected readonly mailHref = `mailto:${this.email}`;
  protected readonly telHref = `tel:${this.phone.replace(/\s/g, '')}`;
}
