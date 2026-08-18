/** Formats an integer amount of COP cents as a localized currency string. */
export function formatCentsAsCurrency(amountInCents: number, currency = 'COP'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
