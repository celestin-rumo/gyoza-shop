import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  AdminProductionSessionService,
  CreateProductOutputPayload,
  CreateRawMaterialUsagePayload,
  CreateSessionParticipantPayload,
} from '../../../services/admin-production-session.service';
import { AdminRawMaterialService } from '../../../services/admin-raw-material.service';
import { AdminProductService } from '../../../services/admin-product.service';
import { AdminUser, AdminUserService } from '../../../services/admin-user.service';
import { AuthService } from '../../../services/auth.service';
import { ProductionSession } from '../../../models/production-session.model';
import { RawMaterial } from '../../../models/raw-material.model';
import { Product } from '../../../models/product.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';

interface RawMaterialUsageLine {
  rawMaterialId: number | null;
  quantityUsed: number;
}

interface ParticipantLine {
  userId: string | null;
  hoursSpent: number;
}

interface OutputLine {
  productId: number | null;
  quantityProduced: number;
}

@Component({
  selector: 'app-admin-production-sessions',
  imports: [DsSectionHeaderComponent, DsButtonComponent, RouterLink],
  templateUrl: './admin-production-sessions.html',
  styleUrl: './admin-production-sessions.scss',
})
export class AdminProductionSessions implements OnInit {
  private readonly adminProductionSessionService = inject(AdminProductionSessionService);
  private readonly adminRawMaterialService = inject(AdminRawMaterialService);
  private readonly adminProductService = inject(AdminProductService);
  private readonly adminUserService = inject(AdminUserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly sessions = signal<ProductionSession[]>([]);
  protected readonly rawMaterials = signal<RawMaterial[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly admins = signal<AdminUser[]>([]);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly date = signal(this.today());
  protected readonly notes = signal('');
  protected readonly rawMaterialLines = signal<RawMaterialUsageLine[]>([this.emptyRawMaterialLine()]);
  protected readonly participantLines = signal<ParticipantLine[]>([this.emptyParticipantLine()]);
  protected readonly outputLines = signal<OutputLine[]>([this.emptyOutputLine()]);

  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);

  protected readonly canSubmit = computed(
    () =>
      this.date().length > 0 &&
      this.validRawMaterialUsages().length > 0 &&
      this.validParticipants().length > 0 &&
      this.validOutputs().length > 0,
  );

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [sessions, rawMaterials, products, admins] = await Promise.all([
        firstValueFrom(this.adminProductionSessionService.getAllSessions()),
        firstValueFrom(this.adminRawMaterialService.getAllRawMaterials()),
        firstValueFrom(this.adminProductService.getAllProducts()),
        firstValueFrom(this.adminUserService.getAdmins()),
      ]);

      this.sessions.set(sessions);
      this.rawMaterials.set(rawMaterials);
      this.products.set(products);
      this.admins.set(admins);
    } catch {
      this.loadError.set('Impossible de charger les données.');
    } finally {
      this.loading.set(false);
    }
  }

  protected addLine<T>(lines: WritableSignal<T[]>, empty: T): void {
    lines.update((current) => [...current, empty]);
  }

  protected removeLine<T>(lines: WritableSignal<T[]>, index: number): void {
    lines.update((current) => current.filter((_, i) => i !== index));
  }

  protected updateLine<T>(lines: WritableSignal<T[]>, index: number, patch: Partial<T>): void {
    lines.update((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  protected emptyRawMaterialLine(): RawMaterialUsageLine {
    return { rawMaterialId: null, quantityUsed: 0 };
  }

  protected emptyParticipantLine(): ParticipantLine {
    return { userId: null, hoursSpent: 0 };
  }

  protected emptyOutputLine(): OutputLine {
    return { productId: null, quantityProduced: 0 };
  }

  protected async createSession(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    try {
      const session = await firstValueFrom(
        this.adminProductionSessionService.createSession({
          date: this.date(),
          notes: this.notes().trim().length > 0 ? this.notes() : null,
          rawMaterialUsages: this.validRawMaterialUsages(),
          participants: this.validParticipants(),
          outputs: this.validOutputs(),
        }),
      );

      this.sessions.update((sessions) => [session, ...sessions]);
      this.resetForm();
    } catch (error) {
      this.createError.set(this.extractErrorMessage(error));
    } finally {
      this.creating.set(false);
    }
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  private validRawMaterialUsages(): CreateRawMaterialUsagePayload[] {
    return this.rawMaterialLines()
      .filter((line) => line.rawMaterialId !== null && line.quantityUsed > 0)
      .map((line) => ({ rawMaterialId: line.rawMaterialId as number, quantityUsed: line.quantityUsed }));
  }

  private validParticipants(): CreateSessionParticipantPayload[] {
    return this.participantLines()
      .filter((line) => line.userId !== null && line.hoursSpent > 0)
      .map((line) => ({ userId: line.userId as string, hoursSpent: line.hoursSpent }));
  }

  private validOutputs(): CreateProductOutputPayload[] {
    return this.outputLines()
      .filter((line) => line.productId !== null && line.quantityProduced > 0)
      .map((line) => ({ productId: line.productId as number, quantityProduced: line.quantityProduced }));
  }

  private resetForm(): void {
    this.date.set(this.today());
    this.notes.set('');
    this.rawMaterialLines.set([this.emptyRawMaterialLine()]);
    this.participantLines.set([this.emptyParticipantLine()]);
    this.outputLines.set([this.emptyOutputLine()]);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return 'Impossible d’enregistrer cette session.';
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
