import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { AdminSlotAvailabilityService } from '../../../services/admin-slot-availability.service';
import { AuthService } from '../../../services/auth.service';
import { SlotAvailability } from '../../../models/slot-availability.model';
import {
  CONTENT_TYPE_LABELS,
  ContentType,
  FULFILLMENT_METHOD_LABELS,
  FulfillmentMethod,
  formatTimeRange,
} from '../../../models/fulfillment.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsOptionComponent } from '../../../design-system/components/ds-option/ds-option.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';

interface NewSlotForm {
  date: string;
  fulfillmentMethod: FulfillmentMethod;
  startTime: string;
  endTime: string;
  contentType: ContentType;
}

@Component({
  selector: 'app-admin-slots',
  imports: [
    DsSectionHeaderComponent,
    DsButtonComponent,
    DsOptionComponent,
    FormField,
    FormRoot,
    RouterLink,
    FullCalendarModule,
  ],
  templateUrl: './admin-slots.html',
  styleUrl: './admin-slots.scss',
})
export class AdminSlots implements OnInit {
  private readonly adminSlotAvailabilityService = inject(AdminSlotAvailabilityService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly formatTimeRange = formatTimeRange;
  protected readonly fulfillmentMethodLabels = FULFILLMENT_METHOD_LABELS;
  protected readonly contentTypeLabels = CONTENT_TYPE_LABELS;

  protected readonly slots = signal<SlotAvailability[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly savingSlot = signal(false);
  protected readonly slotFormError = signal<string | null>(null);
  protected readonly togglingSlotId = signal<number | null>(null);
  protected readonly deletingSlotId = signal<number | null>(null);

  protected readonly editingSlotId = signal<number | null>(null);
  /** True only once the user has actually pressed the submit button — required-field
   *  errors stay hidden until then, instead of appearing the moment a field is blurred. */
  protected readonly submitAttempted = signal(false);

  protected readonly moveError = signal<string | null>(null);

  protected readonly newSlot = signal<NewSlotForm>(this.blankSlotForm());

  protected readonly newSlotForm = form(
    this.newSlot,
    (path) => {
      required(path.date, { message: 'La date est requise.' });
      required(path.startTime, { message: 'L’heure de début est requise.' });
      required(path.endTime, { message: 'L’heure de fin est requise.' });
    },
    {
      submission: {
        action: async () => {
          this.slotFormError.set(null);

          const { date, fulfillmentMethod, startTime, endTime, contentType } = this.newSlot();
          if (startTime && endTime && startTime >= endTime) {
            this.slotFormError.set('L’heure de début doit précéder l’heure de fin.');
            return undefined;
          }

          this.savingSlot.set(true);
          const editingId = this.editingSlotId();

          try {
            const request = { date, fulfillmentMethod, startTime, endTime, contentType };
            const saved = await firstValueFrom(
              editingId
                ? this.adminSlotAvailabilityService.updateSlot(editingId, request)
                : this.adminSlotAvailabilityService.createSlot(request),
            );
            this.slots.update((slots) =>
              editingId
                ? slots.map((existing) => (existing.id === saved.id ? saved : existing))
                : [...slots, saved],
            );
            this.editingSlotId.set(null);
            this.newSlot.set(this.blankSlotForm());
            this.submitAttempted.set(false);
          } catch (error) {
            this.slotFormError.set(
              this.extractErrorMessage(error, editingId ? 'Impossible de modifier ce créneau.' : 'Impossible de créer ce créneau.'),
            );
          } finally {
            this.savingSlot.set(false);
          }

          return undefined;
        },
      },
    },
  );

  protected readonly calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    height: 'auto',
    editable: true,
    dateClick: (arg: DateClickArg) => this.onDateClick(arg.dateStr),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    eventDrop: (arg: EventDropArg) => this.onEventDrop(arg),
    events: this.slots().map((slot) => ({
      id: `slot-${slot.id}`,
      title: `${formatTimeRange(slot.startTime, slot.endTime)} · ${CONTENT_TYPE_LABELS[slot.contentType]}`,
      start: slot.date,
      allDay: true,
      classNames: [
        'admin-slots__event',
        slot.contentType === 'FRESH' ? 'admin-slots__event--fresh' : 'admin-slots__event--frozen',
        slot.open ? 'admin-slots__event--open' : 'admin-slots__event--closed',
      ],
    })),
  }));

  ngOnInit(): void {
    this.loadAll();
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  protected selectNewSlotMethod(method: FulfillmentMethod): void {
    this.newSlot.update((model) => ({ ...model, fulfillmentMethod: method }));
  }

  protected selectNewContentType(contentType: ContentType): void {
    this.newSlot.update((model) => ({ ...model, contentType }));
  }

  protected startEdit(slotAvailability: SlotAvailability): void {
    this.slotFormError.set(null);
    this.submitAttempted.set(false);
    this.editingSlotId.set(slotAvailability.id);
    this.newSlot.set({
      date: slotAvailability.date,
      fulfillmentMethod: slotAvailability.fulfillmentMethod,
      startTime: slotAvailability.startTime.slice(0, 5),
      endTime: slotAvailability.endTime.slice(0, 5),
      contentType: slotAvailability.contentType,
    });
  }

  protected cancelEdit(): void {
    this.slotFormError.set(null);
    this.submitAttempted.set(false);
    this.editingSlotId.set(null);
    this.newSlot.set(this.blankSlotForm());
  }

  protected async toggleSlot(slotAvailability: SlotAvailability): Promise<void> {
    this.togglingSlotId.set(slotAvailability.id);

    try {
      const updated = await firstValueFrom(
        this.adminSlotAvailabilityService.setOpen(slotAvailability.id, !slotAvailability.open),
      );
      this.slots.update((slots) => slots.map((existing) => (existing.id === updated.id ? updated : existing)));
    } catch {
      // Row keeps its previous state — the same toggle button can just be pressed again.
    } finally {
      this.togglingSlotId.set(null);
    }
  }

  protected async deleteSlot(slotAvailability: SlotAvailability): Promise<void> {
    if (!confirm('Supprimer ce créneau ?')) {
      return;
    }

    this.deletingSlotId.set(slotAvailability.id);

    try {
      await firstValueFrom(this.adminSlotAvailabilityService.deleteSlot(slotAvailability.id));
      this.slots.update((slots) => slots.filter((existing) => existing.id !== slotAvailability.id));
    } catch {
      // Row stays in the list — the same delete button can just be pressed again.
    } finally {
      this.deletingSlotId.set(null);
    }
  }

  private onDateClick(dateStr: string): void {
    this.newSlot.update((model) => ({ ...model, date: dateStr }));
  }

  private onEventClick(arg: EventClickArg): void {
    const slotId = Number(arg.event.id.slice('slot-'.length));
    const slotAvailability = this.slots().find((slot) => slot.id === slotId);
    if (slotAvailability) {
      this.toggleSlot(slotAvailability);
    }
  }

  private async onEventDrop(arg: EventDropArg): Promise<void> {
    this.moveError.set(null);
    const slotId = Number(arg.event.id.slice('slot-'.length));
    const dateStr = arg.event.startStr;

    try {
      const updated = await firstValueFrom(this.adminSlotAvailabilityService.moveDate(slotId, dateStr));
      this.slots.update((slots) => slots.map((existing) => (existing.id === updated.id ? updated : existing)));
    } catch (error) {
      this.moveError.set(this.extractErrorMessage(error, 'Impossible de déplacer ce créneau.'));
      arg.revert();
    }
  }

  private async loadAll(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const slots = await firstValueFrom(this.adminSlotAvailabilityService.getAllSlots());
      this.slots.set(slots);
    } catch {
      this.loadError.set('Impossible de charger les créneaux.');
    } finally {
      this.loading.set(false);
    }
  }

  private blankSlotForm(): NewSlotForm {
    return { date: '', fulfillmentMethod: 'PICKUP', startTime: '', endTime: '', contentType: 'FRESH' };
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return fallback;
  }
}
