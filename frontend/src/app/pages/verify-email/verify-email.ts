import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { DsAuthCardComponent } from '../../design-system/components/ds-auth-card/ds-auth-card.component';
import { DsFormMessageComponent } from '../../design-system/components/ds-form-message/ds-form-message.component';

type VerifyEmailStatus = 'pending' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  imports: [DsAuthCardComponent, DsFormMessageComponent, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly status = signal<VerifyEmailStatus>('pending');

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status.set('error');
      return;
    }

    try {
      await firstValueFrom(this.authService.verifyEmail(token));
      this.status.set('success');
    } catch {
      this.status.set('error');
    }
  }
}
