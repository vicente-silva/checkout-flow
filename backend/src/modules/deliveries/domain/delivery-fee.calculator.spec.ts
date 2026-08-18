import { calculateDeliveryFeeInCents } from './delivery-fee.calculator';

describe('calculateDeliveryFeeInCents', () => {
  it.each([
    ['Bogota', 800000],
    ['bogotá', 800000],
    ['  MEDELLIN  ', 1000000],
    ['Cali', 1000000],
    ['Barranquilla', 1200000],
    ['Cartagena', 1200000],
  ])('returns the fee for %s', (city, expectedFee) => {
    expect(calculateDeliveryFeeInCents(city)).toBe(expectedFee);
  });

  it('falls back to the default fee for an unknown city', () => {
    expect(calculateDeliveryFeeInCents('Leticia')).toBe(1500000);
  });

  it('falls back to the default fee for empty input', () => {
    expect(calculateDeliveryFeeInCents('')).toBe(1500000);
  });
});
