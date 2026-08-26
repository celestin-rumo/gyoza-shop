import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { email, form, FormRoot, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { AdminUser, AdminUserService } from '../../../services/admin-user.service';
import { AuthService } from '../../../services/auth.service';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';
import {
  DsAutocompleteComponent,
  DsAutocompleteOption,
} from '../../../design-system/components/ds-autocomplete/ds-autocomplete.component';
import { DsFormMessageComponent } from '../../../design-system/components/ds-form-message/ds-form-message.component';

interface AddAdminFields {
  email: string;
}

@Component({
  selector: 'app-admin-users',
  imports: [
    DsSectionHeaderComponent,
    DsButtonComponent,
    DsAutocompleteComponent,
    DsFormMessageComponent,
    FormRoot,
    RouterLink,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers implements OnInit {
  private readonly adminUserService = inject(AdminUserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly admins = signal<AdminUser[]>([]);
  protected readonly allUsers = signal<AdminUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly revokingEmail = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  /** Customers only: existing admins have nothing to gain from being suggested again. */
  protected readonly userOptions = computed<DsAutocompleteOption[]>(() =>
    this.allUsers()
      .filter((user) => user.role !== 'ADMIN')
      .map((user) => ({
        label: `${user.firstName} ${user.lastName} — ${user.email}`,
        value: user.email,
      })),
  );

  protected readonly fields = signal<AddAdminFields>({ email: '' });

  protected readonly addAdminForm = form(
    this.fields,
    (path) => {
      required(path.email, { message: 'L’email est requis.' });
      email(path.email, { message: 'Veuillez saisir un email valide.' });
    },
    {
      submission: {
        action: async () => {
          this.submitError.set(null);
          this.submitting.set(true);

          try {
            const promoted = await firstValueFrom(
              this.adminUserService.updateRole(this.fields().email, 'ADMIN'),
            );
            this.admins.update((admins) => [...admins, promoted]);
            this.fields.set({ email: '' });
          } catch (error: unknown) {
            this.submitError.set(this.errorMessage(error));
          } finally {
            this.submitting.set(false);
          }

          return undefined;
        },
      },
    },
  );

  ngOnInit(): void {
    this.loadAdmins();
    this.loadAllUsers();
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  protected async revoke(user: AdminUser): Promise<void> {
    this.revokingEmail.set(user.email);

    try {
      await firstValueFrom(this.adminUserService.updateRole(user.email, 'CUSTOMER'));
      this.admins.update((admins) => admins.filter((admin) => admin.email !== user.email));
    } catch {
      // Best-effort: leave the row in place so the admin can retry.
    } finally {
      this.revokingEmail.set(null);
    }
  }

  private async loadAdmins(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const admins = await firstValueFrom(this.adminUserService.getAdmins());
      this.admins.set(admins);
    } catch {
      this.loadError.set('Impossible de charger les comptes admin.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAllUsers(): Promise<void> {
    try {
      const users = await firstValueFrom(this.adminUserService.getAllUsers());
      this.allUsers.set(users);
    } catch {
      // Best-effort: the autocomplete just has no suggestions, manual entry still works.
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        return 'Aucun compte avec cet email.';
      }
      if (error.status === 400) {
        return 'Impossible de modifier ce rôle (compte protégé ou propre compte).';
      }
    }

    return 'Une erreur est survenue, réessaie plus tard.';
  }
}
