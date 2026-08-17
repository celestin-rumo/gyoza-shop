import { inject, Pipe, PipeTransform } from '@angular/core';
import { CurrencyService } from '../currency.service';

/**
 * {{ pack.price | dsPrice }}
 *
 * Formate un prix avec la devise centralisée dans `CurrencyService`, seul endroit à
 * modifier pour changer de devise ou appliquer un taux de change.
 */
@Pipe({ name: 'dsPrice' })
export class DsPricePipe implements PipeTransform {
  private readonly currency = inject(CurrencyService);

  transform(value: number): string {
    return this.currency.format(value);
  }
}
