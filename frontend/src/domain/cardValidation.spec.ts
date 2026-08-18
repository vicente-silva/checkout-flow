import {
  detectCardBrand,
  formatCardNumberForDisplay,
  isValidCardHolder,
  isValidCardNumber,
  isValidCvc,
  isValidExpiry,
} from './cardValidation';

describe('isValidCardNumber (Luhn)', () => {
  it('accepts well-known valid test numbers', () => {
    expect(isValidCardNumber('4242424242424242')).toBe(true);
    expect(isValidCardNumber('5555555555554444')).toBe(true);
  });

  it('accepts numbers formatted with spaces', () => {
    expect(isValidCardNumber('4242 4242 4242 4242')).toBe(true);
  });

  it('rejects numbers that fail the checksum', () => {
    expect(isValidCardNumber('4242424242424241')).toBe(false);
  });

  it('rejects non-numeric or wrong-length input', () => {
    expect(isValidCardNumber('123')).toBe(false);
    expect(isValidCardNumber('abcd efgh ijkl mnop')).toBe(false);
    expect(isValidCardNumber('')).toBe(false);
  });
});

describe('detectCardBrand', () => {
  it('detects Visa from the leading 4', () => {
    expect(detectCardBrand('4242424242424242')).toBe('visa');
  });

  it('detects Mastercard from the 51-55 BIN range', () => {
    expect(detectCardBrand('5555555555554444')).toBe('mastercard');
  });

  it('detects Mastercard from the 2221-2720 BIN range', () => {
    expect(detectCardBrand('2223000048400011')).toBe('mastercard');
  });

  it('returns unknown for unrecognized BINs', () => {
    expect(detectCardBrand('6011000000000004')).toBe('unknown');
  });
});

describe('isValidCvc', () => {
  it('accepts 3 or 4 digit codes', () => {
    expect(isValidCvc('123')).toBe(true);
    expect(isValidCvc('1234')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidCvc('12')).toBe(false);
    expect(isValidCvc('12a')).toBe(false);
  });
});

describe('isValidCardHolder', () => {
  it('requires at least 3 characters', () => {
    expect(isValidCardHolder('Jo')).toBe(false);
    expect(isValidCardHolder('Jane Doe')).toBe(true);
    expect(isValidCardHolder('   ')).toBe(false);
  });
});

describe('isValidExpiry', () => {
  it('rejects malformed input', () => {
    expect(isValidExpiry('1', '30')).toBe(false);
    expect(isValidExpiry('13', '30')).toBe(false);
    expect(isValidExpiry('00', '30')).toBe(false);
  });

  it('rejects a date in the past', () => {
    expect(isValidExpiry('01', '20')).toBe(false);
  });

  it('accepts a date far in the future', () => {
    expect(isValidExpiry('12', '35')).toBe(true);
  });
});

describe('formatCardNumberForDisplay', () => {
  it('groups digits into blocks of four', () => {
    expect(formatCardNumberForDisplay('4242424242424242')).toBe('4242 4242 4242 4242');
  });

  it('caps length at 19 raw digits', () => {
    expect(formatCardNumberForDisplay('42424242424242424242')).toHaveLength(23);
  });
});
