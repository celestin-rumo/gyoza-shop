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
import { CurrencyService } from '../../../services/currency.service';
import { ProductionSession } from '../../../models/production-session.model';
import { RawMaterial } from '../../../models/raw-material.model';
import { PurchaseSource } from '../../../models/raw-material-purchase.model';
import { Product } from '../../../models/product.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';
import { DsNumberStepperComponent, DsStep, DsStepperComponent } from '../../../design-system';

interface RawMaterialUsageLine {
  rawMaterialId: number | null;
  quantityUsed: number;
  targetProductId: number | null;
}

interface ParticipantLine {
  userId: string | null;
}

interface OutputLine {
  productId: number | null;
  quantityProduced: number;
}

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
  imports: [DsSectionHeaderComponent, DsButtonComponent, DsStepperComponent, DsNumberStepperComponent, RouterLink],
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
  protected readonly currencyService = inject(CurrencyService);

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
  protected readonly otherCosts = signal(0);

  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);

  // Inline "log a purchase for this raw material" mini-form, opened from a single line of
  // the raw-materials step. Independent from the session itself: it posts its own
  // RawMaterialPurchase immediately rather than being bundled into the session payload.
  protected readonly purchaseDraftOpenIndex = signal<number | null>(null);
  protected readonly purchaseDraftDate = signal(this.today());
  protected readonly purchaseDraftQuantity = signal(0);
  protected readonly purchaseDraftPrice = signal(0);
  protected readonly purchaseDraftSource = signal<PurchaseSource>('MANUAL');
  protected readonly purchaseDraftOriginCountry = signal('');
  protected readonly purchaseDraftStore = signal('');
  protected readonly purchaseDraftBatchNumber = signal('');
  protected readonly savingPurchaseDraft = signal(false);
  protected readonly purchaseDraftError = signal<string | null>(null);

  protected readonly canSavePurchaseDraft = computed(
    () =>
      this.purchaseDraftDate().length > 0 &&
      this.purchaseDraftQuantity() > 0 &&
      this.purchaseDraftPrice() > 0 &&
      this.purchaseDraftOriginCountry().trim().length > 0 &&
      this.purchaseDraftStore().trim().length > 0,
  );

  // Inline "modifier les autres charges" edit, opened from a session's expanded detail card.
  protected readonly editingOtherCostsSessionId = signal<number | null>(null);
  protected readonly otherCostsDraft = signal(0);
  protected readonly savingOtherCosts = signal(false);
  protected readonly otherCostsError = signal<string | null>(null);

  protected readonly wizardOpen = signal(false);
  protected readonly currentStepIndex = signal(DATE_STEP);
  protected readonly steps = WIZARD_STEPS;
  /** Batch number of the session this wizard run was pre-filled from, if any. */
  protected readonly duplicatingFromBatch = signal<string | null>(null);
  /** Id of the session this wizard run is editing in place, if any (vs. creating a new one). */
  protected readonly editingSessionId = signal<number | null>(null);

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

  protected removeLine<T>(lines: WritableSignal<T[]>, index: number, isRawMaterialLines = false): void {
    lines.update((current) => current.filter((_, i) => i !== index));

    // Removing a raw material line can shift indices out from under an open purchase
    // draft; simplest safe behavior is to just close it.
    if (isRawMaterialLines) {
      this.purchaseDraftOpenIndex.set(null);
    }
  }

  protected updateLine<T>(lines: WritableSignal<T[]>, index: number, patch: Partial<T>): void {
    lines.update((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  protected emptyRawMaterialLine(): RawMaterialUsageLine {
    return { rawMaterialId: null, quantityUsed: 0, targetProductId: null };
  }

  protected emptyParticipantLine(): ParticipantLine {
    return { userId: null };
  }

  protected emptyOutputLine(): OutputLine {
    return { productId: null, quantityProduced: 0 };
  }

  protected togglePurchaseDraft(index: number): void {
    if (this.purchaseDraftOpenIndex() === index) {
      this.purchaseDraftOpenIndex.set(null);
      return;
    }

    this.resetPurchaseDraft();
    this.purchaseDraftOpenIndex.set(index);
  }

  protected async savePurchaseDraft(index: number): Promise<void> {
    const rawMaterialId = this.rawMaterialLines()[index]?.rawMaterialId;
    if (rawMaterialId == null || !this.canSavePurchaseDraft()) {
      return;
    }

    this.savingPurchaseDraft.set(true);
    this.purchaseDraftError.set(null);

    try {
      await firstValueFrom(
        this.adminRawMaterialService.createPurchase({
          rawMaterialId,
          date: this.purchaseDraftDate(),
          quantityPurchased: this.purchaseDraftQuantity(),
          totalPricePaid: this.purchaseDraftPrice(),
          source: this.purchaseDraftSource(),
          originCountry: this.purchaseDraftOriginCountry(),
          store: this.purchaseDraftStore(),
          batchNumber:
            this.purchaseDraftBatchNumber().trim().length > 0 ? this.purchaseDraftBatchNumber() : null,
        }),
      );

      this.rawMaterials.set(await firstValueFrom(this.adminRawMaterialService.getAllRawMaterials()));
      this.purchaseDraftOpenIndex.set(null);
      this.resetPurchaseDraft();
    } catch (error) {
      this.purchaseDraftError.set(
        this.extractErrorMessage(error, "Impossible d’enregistrer cet achat."),
      );
    } finally {
      this.savingPurchaseDraft.set(false);
    }
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

  protected startEditOtherCosts(session: ProductionSession): void {
    this.otherCostsError.set(null);
    this.otherCostsDraft.set(session.otherCosts);
    this.editingOtherCostsSessionId.set(session.id);
  }

  protected cancelEditOtherCosts(): void {
    this.editingOtherCostsSessionId.set(null);
  }

  protected async saveOtherCosts(sessionId: number): Promise<void> {
    this.savingOtherCosts.set(true);
    this.otherCostsError.set(null);

    try {
      const updated = await firstValueFrom(
        this.adminProductionSessionService.updateOtherCosts(sessionId, this.otherCostsDraft()),
      );

      this.sessions.update((sessions) => sessions.map((s) => (s.id === sessionId ? updated : s)));
      this.editingOtherCostsSessionId.set(null);
    } catch (error) {
      this.otherCostsError.set(this.extractErrorMessage(error, 'Impossible de mettre à jour les autres charges.'));
    } finally {
      this.savingOtherCosts.set(false);
    }
  }

  protected openWizard(): void {
    this.resetForm();
    this.duplicatingFromBatch.set(null);
    this.editingSessionId.set(null);
    this.currentStepIndex.set(DATE_STEP);
    this.wizardOpen.set(true);
  }

  /**
   * Opens the wizard pre-filled from an existing session to edit it in place — every field
   * except the date (fixed: it drives the batch number, never regenerated). Submitting sends a
   * full update instead of creating a new session.
   */
  protected startEditSession(session: ProductionSession): void {
    this.date.set(session.date);
    this.notes.set(session.notes ?? '');
    this.durationHours.set(session.durationHours);
    this.otherCosts.set(session.otherCosts);

    this.rawMaterialLines.set(
      session.rawMaterialUsages.length > 0
        ? session.rawMaterialUsages.map((usage) => ({
            rawMaterialId: usage.rawMaterialId,
            quantityUsed: usage.quantityUsed,
            targetProductId: usage.targetProductId,
          }))
        : [this.emptyRawMaterialLine()],
    );

    this.participantLines.set(
      session.participants.length > 0
        ? session.participants.map((participant) => ({ userId: participant.userId }))
        : [this.emptyParticipantLine()],
    );

    this.outputLines.set(
      session.outputs.length > 0
        ? session.outputs.map((output) => ({
            productId: output.productId,
            quantityProduced: output.quantityProduced,
          }))
        : [this.emptyOutputLine()],
    );

    this.purchaseDraftOpenIndex.set(null);
    this.resetPurchaseDraft();
    this.createError.set(null);
    this.duplicatingFromBatch.set(null);
    this.editingSessionId.set(session.id);
    this.currentStepIndex.set(DATE_STEP);
    this.wizardOpen.set(true);
  }

  /**
   * Opens the wizard pre-filled from a past session — raw material lines, participants,
   * outputs, duration and other costs are copied over; only the date resets to today. The
   * duplicate is a fully independent session: nothing here links back to the original.
   */
  protected duplicateSession(session: ProductionSession): void {
    this.date.set(this.today());
    this.notes.set(session.notes ?? '');
    this.durationHours.set(session.durationHours);
    this.otherCosts.set(session.otherCosts);

    this.rawMaterialLines.set(
      session.rawMaterialUsages.length > 0
        ? session.rawMaterialUsages.map((usage) => ({
            rawMaterialId: usage.rawMaterialId,
            quantityUsed: usage.quantityUsed,
            targetProductId: usage.targetProductId,
          }))
        : [this.emptyRawMaterialLine()],
    );

    this.participantLines.set(
      session.participants.length > 0
        ? session.participants.map((participant) => ({ userId: participant.userId }))
        : [this.emptyParticipantLine()],
    );

    this.outputLines.set(
      session.outputs.length > 0
        ? session.outputs.map((output) => ({
            productId: output.productId,
            quantityProduced: output.quantityProduced,
          }))
        : [this.emptyOutputLine()],
    );

    this.purchaseDraftOpenIndex.set(null);
    this.resetPurchaseDraft();
    this.createError.set(null);
    this.duplicatingFromBatch.set(session.batchNumber);
    this.editingSessionId.set(null);
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
      if (this.editingSessionId() !== null) {
        await this.updateSession();
      } else {
        await this.createSession();
      }
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
          otherCosts: this.otherCosts(),
          rawMaterialUsages: this.validRawMaterialUsages(),
          participants: this.validParticipants(),
          outputs: this.validOutputs(),
        }),
      );

      this.sessions.update((sessions) => [session, ...sessions]);
      this.closeWizard();
    } catch (error) {
      this.createError.set(this.extractErrorMessage(error, 'Impossible d’enregistrer cette session.'));
    } finally {
      this.creating.set(false);
    }
  }

  private async updateSession(): Promise<void> {
    const sessionId = this.editingSessionId();
    if (sessionId === null) {
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    try {
      const session = await firstValueFrom(
        this.adminProductionSessionService.updateSession(sessionId, {
          durationHours: this.durationHours(),
          notes: this.notes().trim().length > 0 ? this.notes() : null,
          otherCosts: this.otherCosts(),
          rawMaterialUsages: this.validRawMaterialUsages(),
          participants: this.validParticipants(),
          outputs: this.validOutputs(),
        }),
      );

      this.sessions.update((sessions) => sessions.map((s) => (s.id === sessionId ? session : s)));
      this.closeWizard();
    } catch (error) {
      this.createError.set(this.extractErrorMessage(error, 'Impossible de mettre à jour cette session.'));
    } finally {
      this.creating.set(false);
    }
  }

  private validRawMaterialUsages(): CreateRawMaterialUsagePayload[] {
    return this.rawMaterialLines()
      .filter((line) => line.rawMaterialId !== null && line.quantityUsed > 0)
      .map((line) => ({
        rawMaterialId: line.rawMaterialId as number,
        quantityUsed: line.quantityUsed,
        targetProductId: line.targetProductId,
      }));
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
    this.otherCosts.set(0);
    this.purchaseDraftOpenIndex.set(null);
    this.resetPurchaseDraft();
  }

  private resetPurchaseDraft(): void {
    this.purchaseDraftDate.set(this.today());
    this.purchaseDraftQuantity.set(0);
    this.purchaseDraftPrice.set(0);
    this.purchaseDraftSource.set('MANUAL');
    this.purchaseDraftOriginCountry.set('');
    this.purchaseDraftStore.set('');
    this.purchaseDraftBatchNumber.set('');
    this.purchaseDraftError.set(null);
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return fallback;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
