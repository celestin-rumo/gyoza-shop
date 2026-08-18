import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';

@Component({
  selector: 'app-admin-home',
  imports: [DsSectionHeaderComponent, DsButtonComponent, RouterLink],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.scss',
})
export class AdminHome {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
