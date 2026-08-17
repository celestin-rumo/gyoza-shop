import { Injectable, signal } from '@angular/core';

/**
 * Source unique de vérité pour la devise affichée dans toute l'application.
 * Les prix des produits sont saisis dans la devise de base (`baseCode`) ; `rate` permet
 * d'appliquer un taux de change pour les afficher dans une autre devise (`code`) sans
 * toucher aux données produit.
 */
@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly _code = signal('CHF');
  private readonly _rate = signal(1);

  /** Code de la devise affichée (ex: CHF, EUR). */
  readonly code = this._code.asReadonly();
  /** Taux appliqué aux prix (stockés dans la devise de base) pour obtenir `code`. */
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
