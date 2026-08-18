import { Transaction, TransactionStatus } from './transaction.entity';

function buildTransaction(status = TransactionStatus.PENDING): Transaction {
  return new Transaction(
    'tx-1',
    'REF-1',
    'product-1',
    'customer-1',
    'delivery-1',
    1,
    100000,
    5000,
    8000,
    113000,
    status,
    null,
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-01T00:00:00Z'),
  );
}

describe('Transaction entity', () => {
  it('isPending is true only while status is PENDING', () => {
    expect(buildTransaction(TransactionStatus.PENDING).isPending()).toBe(true);
    expect(buildTransaction(TransactionStatus.APPROVED).isPending()).toBe(false);
  });

  it('isFinal is true for any non-PENDING status', () => {
    expect(buildTransaction(TransactionStatus.PENDING).isFinal()).toBe(false);
    expect(buildTransaction(TransactionStatus.DECLINED).isFinal()).toBe(true);
  });

  it('markWith updates status, gateway id and updatedAt', () => {
    const transaction = buildTransaction();
    const before = transaction.updatedAt;

    transaction.markWith(TransactionStatus.APPROVED, 'gtw-123');

    expect(transaction.status).toBe(TransactionStatus.APPROVED);
    expect(transaction.gatewayTransactionId).toBe('gtw-123');
    expect(transaction.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
