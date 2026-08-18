/**
 * Domain entity: framework-agnostic, no TypeORM/Nest decorators.
 * This is what use cases and ports work with.
 */
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    /** Price in COP cents (integer), matching Wompi's amount_in_cents convention. */
    public readonly priceInCents: number,
    public readonly imageUrl: string,
    public readonly sku: string,
    public stockQuantity: number,
  ) {}

  hasStockFor(units: number): boolean {
    return this.stockQuantity >= units;
  }

  decreaseStock(units: number): void {
    if (!this.hasStockFor(units)) {
      throw new Error(`Cannot decrease ${units} units, only ${this.stockQuantity} available`);
    }
    this.stockQuantity -= units;
  }
}
