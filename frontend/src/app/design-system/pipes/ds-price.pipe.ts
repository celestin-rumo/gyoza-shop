import { inject, Pipe, PipeTransform } from '@angular/core';
import { CurrencyService } from '../../services/currency.service';

/**
 * {{ pack.price | dsPrice }}
 *
 * Formats a price using the currency centralized in `CurrencyService`, the only place
 * to change to switch currency or apply an exchange rate.
 */
@Pipe({ name: 'dsPrice' })
export class DsPricePipe implements PipeTransform {
  private readonly currency = inject(CurrencyService);

  transform(value: number): string {
    return this.currency.format(value);
  }
}
