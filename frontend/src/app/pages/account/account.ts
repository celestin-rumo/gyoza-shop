import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { DsButtonComponent } from '../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../design-system/components/ds-section-header/ds-section-header.component';

@Component({
  selector: 'app-account',
  imports: [DsSectionHeaderComponent, DsButtonComponent, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAdmin = this.authService.isAdmin;

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
