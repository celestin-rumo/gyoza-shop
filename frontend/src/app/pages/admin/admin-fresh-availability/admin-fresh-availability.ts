import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';

import { AdminFreshAvailabilityService } from '../../../services/admin-fresh-availability.service';
import { AuthService } from '../../../services/auth.service';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';

interface FreshAvailabilityFormModel {
  nextBatchDate: string;
  orderWindowOpen: boolean;
}

@Component({
  selector: 'app-admin-fresh-availability',
  imports: [DsSectionHeaderComponent, DsButtonComponent, FormField, FormRoot, RouterLink],
  templateUrl: './admin-fresh-availability.html',
  styleUrl: './admin-fresh-availability.scss',
})
export class AdminFreshAvailability implements OnInit {
  private readonly adminFreshAvailabilityService = inject(AdminFreshAvailabilityService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly updating = signal(false);
  protected readonly updateError = signal<string | null>(null);
  protected readonly updateSuccess = signal(false);

  protected readonly availabilityModel = signal<FreshAvailabilityFormModel>({
    nextBatchDate: '',
    orderWindowOpen: false,
  });

  protected readonly availabilityForm = form(
    this.availabilityModel,
    (path) => {
      required(path.nextBatchDate, { message: 'La date du prochain lot est requise.' });
    },
    {
      submission: {
        action: async () => {
          this.updateError.set(null);
          this.updateSuccess.set(false);
          this.updating.set(true);

          try {
            await firstValueFrom(
              this.adminFreshAvailabilityService.update(this.availabilityModel()),
            );
            this.updateSuccess.set(true);
          } catch (error) {
            this.updateError.set(this.extractErrorMessage(error));
          } finally {
            this.updating.set(false);
          }

          return undefined;
        },
      },
    },
  );

  ngOnInit(): void {
    this.loadAvailability();
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  private async loadAvailability(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const availability = await firstValueFrom(this.adminFreshAvailabilityService.getCurrent());
      this.availabilityModel.set({
        nextBatchDate: availability.nextBatchDate ?? '',
        orderWindowOpen: availability.orderWindowOpen,
      });
    } catch {
      this.loadError.set('Impossible de charger la disponibilité des gyozas frais.');
    } finally {
      this.loading.set(false);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return 'Impossible de mettre à jour la disponibilité.';
  }
}
