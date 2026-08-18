import { Injectable, signal } from '@angular/core';

/**
 * Single source of truth for the currency displayed throughout the application.
 * Product prices are entered in the base currency (`baseCode`); `rate` allows applying
 * an exchange rate to display them in another currency (`code`) without touching
 * the product data.
 */
@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly _code = signal('CHF');
  private readonly _rate = signal(1);

  /** Code of the displayed currency (e.g. CHF, EUR). */
  readonly code = this._code.asReadonly();
  /** Rate applied to prices (stored in the base currency) to obtain `code`. */
  readonly rate = this._rate.asReadonly();

  setCode(code: string): void {
    this._code.set(code);
  }

  setRate(rate: number): void {
    this._rate.set(rate);
  }

  format(baseValue: number): string {
    return `${this._code()} ${(baseValue * this._rate()).toFixed(2)}`;
  }
}
