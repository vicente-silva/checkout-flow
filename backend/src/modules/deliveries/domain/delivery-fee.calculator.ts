/**
 * Very small domain service to compute the delivery fee. In real life this
 * would call a carrier/rates API; here we apply a simple, deterministic
 * rule by city so the business flow (fee shown in the summary step) is
 * exercised end-to-end.
 */
const CITY_FEES_IN_CENTS: Record<string, number> = {
  bogota: 800000,
  medellin: 1000000,
  cali: 1000000,
  barranquilla: 1200000,
  cartagena: 1200000,
};

const DEFAULT_FEE_IN_CENTS = 1500000;

export function calculateDeliveryFeeInCents(city: string): number {
  const key = normalize(city);
  return CITY_FEES_IN_CENTS[key] ?? DEFAULT_FEE_IN_CENTS;
}

/** Lowercases and strips diacritics (U+0300-U+036F are the combining marks left by NFD). */
function normalize(city: string): string {
  return (city ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
