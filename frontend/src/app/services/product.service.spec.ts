import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProductService } from './product.service';
import { Product } from '../models/product.model';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches the product catalog via GET /api/products', () => {
    const products: Product[] = [
      {
        id: 1,
        name: 'Chicken',
        stockQuantity: 200,
        active: true,
        packs: [{ id: 10, size: 6, price: 12 }],
      },
    ];

    let result: Product[] | undefined;
    service.getProducts().subscribe((response) => (result = response));

    const req = httpMock.expectOne('/api/products');
    expect(req.request.method).toBe('GET');

    req.flush(products);

    expect(result).toEqual(products);
  });
});
