import { formatCentsAsCurrency } from './money';

describe('formatCentsAsCurrency', () => {
  it('converts cents to a formatted COP currency string', () => {
    const formatted = formatCentsAsCurrency(4500000);
    expect(formatted).toContain('45.000');
  });

  it('rounds to whole currency units (no decimals)', () => {
    const formatted = formatCentsAsCurrency(150);
    expect(formatted).not.toMatch(/,\d{2}$/);
  });

  it('handles zero', () => {
    expect(formatCentsAsCurrency(0)).toContain('0');
  });
});
