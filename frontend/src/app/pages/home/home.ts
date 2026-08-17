import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CatalogService } from '../../services/catalog.service';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCartAddEvent,
  DsCartRemoveEvent,
  DsFeatureItemComponent,
  DsProductCardComponent,
  DsSectionHeaderComponent,
} from '../../design-system';

@Component({
  selector: 'app-home',
  imports: [
    DsButtonComponent,
    DsFeatureItemComponent,
    DsBadgeComponent,
    DsSectionHeaderComponent,
    DsProductCardComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  protected readonly cart = inject(CartService);

  protected readonly products = this.catalog.products;

  protected onAddToCart(event: DsCartAddEvent): void {
    this.cart.add(event);
  }

  protected onRemoveFromCart(event: DsCartRemoveEvent): void {
    this.cart.remove(event.product.id, event.pack.id);
  }

  protected onDiscoverGyozas(): void {
    this.router.navigateByUrl('/nos-gyozas');
  }
}
