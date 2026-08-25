import { Component, ElementRef, OnInit, WritableSignal, computed, effect, inject, signal, viewChild } from '@angular/core';
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
import { DsStep, DsStepperComponent } from '../../../design-system';

interface RawMaterialUsageLine {
  rawMaterialId: number | null;
  quantityUsed: number;
}

interface ParticipantLine {
  userId: string | null;
}

interface OutputLine {
  productId: number | null;
  quantityProduced: number;
}

const RAW_MATERIAL_QUANTITY_STEP = 0.1;
const OUTPUT_QUANTITY_STEP = 1;
const DURATION_HOURS_STEP = 0.5;

const DATE_STEP = 0;
const RAW_MATERIALS_STEP = 1;
const PARTICIPANTS_STEP = 2;
const OUTPUTS_STEP = 3;
const DURATION_STEP = 4;

const WIZARD_STEPS: DsStep[] = [
  { id: 'date', label: 'Date' },
  { id: 'matieres', label: 'Matières premières' },
  { id: 'participants', label: 'Participants' },
  { id: 'produits', label: 'Produits fabriqués' },
  { id: 'duree', label: 'Durée' },
];

@Component({
  selector: 'app-admin-production-sessions',
  imports: [DsSectionHeaderComponent, DsButtonComponent, DsStepperComponent, RouterLink],
  templateUrl: './admin-production-sessions.html',
  styleUrl: './admin-production-sessions.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class AdminProductionSessions implements OnInit {
  private readonly adminProductionSessionService = inject(AdminProductionSessionService);
  private readonly adminRawMaterialService = inject(AdminRawMaterialService);
  private readonly adminProductService = inject(AdminProductService);
  private readonly adminUserService = inject(AdminUserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly sessions = signal<ProductionSession[]>([]);
  protected readonly expandedSessionIds = signal<ReadonlySet<number>>(new Set());
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
  protected readonly durationHours = signal(0);

  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);

  protected readonly wizardOpen = signal(false);
  protected readonly currentStepIndex = signal(DATE_STEP);
  protected readonly steps = WIZARD_STEPS;

  private readonly stepHeading = viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');

  protected readonly canAdvance = computed(() => {
    switch (this.currentStepIndex()) {
      case DATE_STEP:
        return this.date().length > 0;
      case RAW_MATERIALS_STEP:
        return this.validRawMaterialUsages().length > 0;
      case PARTICIPANTS_STEP:
        return this.validParticipants().length > 0;
      case OUTPUTS_STEP:
        return this.validOutputs().length > 0;
      case DURATION_STEP:
        return this.durationHours() > 0 && !this.creating();
      default:
        return true;
    }
  });

  constructor() {
    effect(() => {
      const isOpen = this.wizardOpen();
      this.currentStepIndex();

      if (isOpen) {
        queueMicrotask(() => this.stepHeading()?.nativeElement.focus());
      }
    });
  }

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
    return { userId: null };
  }

  protected emptyOutputLine(): OutputLine {
    return { productId: null, quantityProduced: 0 };
  }

  protected adjustRawMaterialQuantity(index: number, direction: 1 | -1): void {
    const current = this.rawMaterialLines()[index]?.quantityUsed ?? 0;
    const next = Math.max(0, current + direction * RAW_MATERIAL_QUANTITY_STEP);

    // Avoid floating-point drift (e.g. 0.1 + 0.2) from repeated clicks.
    this.updateLine(this.rawMaterialLines, index, { quantityUsed: Math.round(next * 1000) / 1000 });
  }

  protected adjustOutputQuantity(index: number, direction: 1 | -1): void {
    const current = this.outputLines()[index]?.quantityProduced ?? 0;
    const next = Math.max(0, current + direction * OUTPUT_QUANTITY_STEP);

    this.updateLine(this.outputLines, index, { quantityProduced: next });
  }

  protected adjustDurationHours(direction: 1 | -1): void {
    const next = Math.max(0, this.durationHours() + direction * DURATION_HOURS_STEP);
    this.durationHours.set(Math.round(next * 1000) / 1000);
  }

  protected toggleSessionExpanded(sessionId: number): void {
    this.expandedSessionIds.update((ids) => {
      const next = new Set(ids);

      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }

      return next;
    });
  }

  protected isSessionExpanded(sessionId: number): boolean {
    return this.expandedSessionIds().has(sessionId);
  }

  protected openWizard(): void {
    this.resetForm();
    this.currentStepIndex.set(DATE_STEP);
    this.wizardOpen.set(true);
  }

  protected closeWizard(): void {
    this.wizardOpen.set(false);
  }

  protected onEscape(): void {
    if (this.wizardOpen()) {
      this.closeWizard();
    }
  }

  protected onWizardBack(): void {
    this.currentStepIndex.update((index) => Math.max(DATE_STEP, index - 1));
  }

  protected async onWizardNext(): Promise<void> {
    if (!this.canAdvance()) {
      return;
    }

    if (this.currentStepIndex() === DURATION_STEP) {
      await this.createSession();
      return;
    }

    this.currentStepIndex.update((index) => index + 1);
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  private async createSession(): Promise<void> {
    this.creating.set(true);
    this.createError.set(null);

    try {
      const session = await firstValueFrom(
        this.adminProductionSessionService.createSession({
          date: this.date(),
          durationHours: this.durationHours(),
          notes: this.notes().trim().length > 0 ? this.notes() : null,
          rawMaterialUsages: this.validRawMaterialUsages(),
          participants: this.validParticipants(),
          outputs: this.validOutputs(),
        }),
      );

      this.sessions.update((sessions) => [session, ...sessions]);
      this.closeWizard();
    } catch (error) {
      this.createError.set(this.extractErrorMessage(error));
    } finally {
      this.creating.set(false);
    }
  }

  private validRawMaterialUsages(): CreateRawMaterialUsagePayload[] {
    return this.rawMaterialLines()
      .filter((line) => line.rawMaterialId !== null && line.quantityUsed > 0)
      .map((line) => ({ rawMaterialId: line.rawMaterialId as number, quantityUsed: line.quantityUsed }));
  }

  private validParticipants(): CreateSessionParticipantPayload[] {
    return this.participantLines()
      .filter((line) => line.userId !== null)
      .map((line) => ({ userId: line.userId as string }));
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
    this.durationHours.set(0);
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
