import { CartService } from './cart.service';
import { DsCartAddEvent } from '../design-system';

function line(overrides: Partial<DsCartAddEvent> = {}): DsCartAddEvent {
  return {
    product: {
      id: 1,
      tagTone: 'accent',
      imageUrl: '',
      imageAlt: '',
      name: 'Chicken',
      description: '',
      packs: [],
    },
    pack: { id: 10, count: 6, price: 12, label: 'Pack de 6' },
    quantity: 1,
    ...overrides,
  };
}

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    service = new CartService();
  });

  it('adds a new line', () => {
    service.add(line());

    expect(service.lines()).toHaveLength(1);
    expect(service.count()).toBe(1);
  });

  it('merges the quantity when the same product/pack is added again', () => {
    service.add(line({ quantity: 2 }));
    service.add(line({ quantity: 3 }));

    expect(service.lines()).toHaveLength(1);
    expect(service.lines()[0].quantity).toBe(5);
  });

  it('keeps separate lines for different packs of the same product', () => {
    service.add(line({ pack: { id: 10, count: 6, price: 12, label: 'Pack de 6' } }));
    service.add(line({ pack: { id: 20, count: 10, price: 19, label: 'Pack de 10' } }));

    expect(service.lines()).toHaveLength(2);
  });

  it('removes a line', () => {
    service.add(line());

    service.remove(1, 10);

    expect(service.lines()).toHaveLength(0);
  });

  it('setQuantity updates the quantity of an existing line', () => {
    service.add(line({ quantity: 1 }));

    service.setQuantity(1, 10, 4);

    expect(service.lines()[0].quantity).toBe(4);
  });

  it('setQuantity removes the line when the quantity drops to 0 or below', () => {
    service.add(line());

    service.setQuantity(1, 10, 0);

    expect(service.lines()).toHaveLength(0);
  });

  it('clear empties the cart', () => {
    service.add(line());

    service.clear();

    expect(service.lines()).toHaveLength(0);
  });

  it('computes the subtotal as the sum of price * quantity across lines', () => {
    service.add(line({ pack: { id: 10, count: 6, price: 12, label: 'Pack de 6' }, quantity: 2 }));
    service.add(
      line({
        product: {
          id: 2,
          tagTone: 'neutral',
          imageUrl: '',
          imageAlt: '',
          name: 'Vegetable',
          description: '',
          packs: [],
        },
        pack: { id: 30, count: 6, price: 11, label: 'Pack de 6' },
        quantity: 1,
      }),
    );

    expect(service.subtotal()).toBe(12 * 2 + 11);
  });

  it('open and close toggle the cart panel visibility', () => {
    expect(service.isOpen()).toBe(false);

    service.open();
    expect(service.isOpen()).toBe(true);

    service.close();
    expect(service.isOpen()).toBe(false);
  });

  it('packQuantitiesInCart aggregates quantities per pack for a given product', () => {
    service.add(line({ pack: { id: 10, count: 6, price: 12, label: 'Pack de 6' }, quantity: 2 }));
    service.add(line({ pack: { id: 20, count: 10, price: 19, label: 'Pack de 10' }, quantity: 1 }));

    expect(service.packQuantitiesInCart(1)).toEqual({ '10': 2, '20': 1 });
  });
});
