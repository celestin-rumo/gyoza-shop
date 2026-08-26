import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';

let nextId = 0;

/**
 * <ds-modal title="Nouvelle session" (closed)="close()">
 *   ...body...
 *   <div modal-footer>
 *     <ds-button (pressed)="close()">Annuler</ds-button>
 *   </div>
 * </ds-modal>
 *
 * A centered dialog with a backdrop; closes on backdrop click, Escape, or the
 * header's close button, and moves focus into the panel when it opens. The
 * caller owns the open/closed state (typically an `@if` around this component).
 */
@Component({
  selector: 'ds-modal',
  templateUrl: './ds-modal.component.html',
  styleUrl: './ds-modal.component.scss',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class DsModalComponent implements AfterViewInit {
  title = input.required<string>();

  closed = output<void>();

  protected readonly titleId = `ds-modal-title-${nextId++}`;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  ngAfterViewInit(): void {
    this.panel()?.nativeElement.focus();
  }

  protected close(): void {
    this.closed.emit();
  }
}
