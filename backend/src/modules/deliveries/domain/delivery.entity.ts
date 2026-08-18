export class Delivery {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly addressLine: string,
    public readonly city: string,
    public readonly region: string,
    public readonly postalCode: string,
    public readonly country: string,
    /** Delivery fee in COP cents, computed from region/distance rules. */
    public readonly deliveryFeeInCents: number,
  ) {}
}
