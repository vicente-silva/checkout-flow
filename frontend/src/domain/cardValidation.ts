export type CardBrand = 'visa' | 'mastercard' | 'unknown';

/** Luhn checksum: standard algorithm used to validate card-number structure. */
export function isValidCardNumber(rawNumber: string): boolean {
  const digits = rawNumber.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/** Detects Visa / Mastercard from the card BIN, for showing the brand logo. */
export function detectCardBrand(rawNumber: string): CardBrand {
  const digits = rawNumber.replace(/\s+/g, '');
  if (/^4\d*/.test(digits)) return 'visa';

  const firstFour = Number(digits.slice(0, 4));
  const firstTwo = Number(digits.slice(0, 2));
  const isMastercardRange =
    (firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720);
  if (digits.length >= 2 && isMastercardRange) return 'mastercard';

  return 'unknown';
}

export function isValidCvc(cvc: string): boolean {
  return /^\d{3,4}$/.test(cvc);
}

/** Wompi's tokenization endpoint rejects card_holder shorter than 5 characters. */
export function isValidCardHolder(name: string): boolean {
  return name.trim().length >= 5;
}

/** Expiry must be a real future month, in MM/YY form. */
export function isValidExpiry(month: string, year: string): boolean {
  if (!/^\d{2}$/.test(month) || !/^\d{2}$/.test(year)) return false;
  const monthNum = Number(month);
  if (monthNum < 1 || monthNum > 12) return false;

  const fullYear = 2000 + Number(year);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (fullYear < currentYear) return false;
  if (fullYear === currentYear && monthNum < currentMonth) return false;
  return true;
}

export function formatCardNumberForDisplay(rawNumber: string): string {
  return rawNumber
    .replace(/\s+/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
}
