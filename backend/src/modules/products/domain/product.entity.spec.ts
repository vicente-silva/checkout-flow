import { Product } from './product.entity';

function buildProduct(stockQuantity = 10): Product {
  return new Product('id-1', 'Widget', 'A widget', 100000, 'http://img', 'SKU-1', stockQuantity);
}

describe('Product entity', () => {
  it('hasStockFor returns true when enough units are available', () => {
    const product = buildProduct(5);
    expect(product.hasStockFor(5)).toBe(true);
    expect(product.hasStockFor(6)).toBe(false);
  });

  it('decreaseStock reduces the stock quantity', () => {
    const product = buildProduct(5);
    product.decreaseStock(2);
    expect(product.stockQuantity).toBe(3);
  });

  it('decreaseStock throws when there is not enough stock', () => {
    const product = buildProduct(1);
    expect(() => product.decreaseStock(2)).toThrow();
  });
});
