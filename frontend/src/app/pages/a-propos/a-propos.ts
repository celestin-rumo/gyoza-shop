import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { DsButtonComponent, DsSectionHeaderComponent } from '../../design-system';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

@Component({
  selector: 'app-a-propos',
  imports: [NgOptimizedImage, DsSectionHeaderComponent, DsButtonComponent],
  templateUrl: './a-propos.html',
  styleUrl: './a-propos.scss',
})
export class APropos {
  private readonly router = inject(Router);

  protected readonly team: TeamMember[] = [
    { name: 'Célestin', role: 'Ingénieur logiciel', bio: 'Le reste du temps derrière un écran.' },
    { name: 'Délia', role: 'Professeure', bio: 'Le reste du temps devant un tableau.' },
  ];

  protected onDiscoverGyozas(): void {
    this.router.navigateByUrl('/nos-gyozas');
  }
}
