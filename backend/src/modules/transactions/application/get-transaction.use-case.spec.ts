import { GetTransactionUseCase } from './get-transaction.use-case';
import { Transaction, TransactionStatus } from '../domain/transaction.entity';
import { DomainErrorCode } from '@shared/domain/result';

describe('GetTransactionUseCase', () => {
  it('returns the transaction when found', async () => {
    const transaction = new Transaction(
      'tx-1', 'REF-1', 'p1', 'c1', 'd1', 1, 100, 5, 8, 113,
      TransactionStatus.PENDING, null, new Date(), new Date(),
    );
    const repository = { create: jest.fn(), findById: jest.fn().mockResolvedValue(transaction), save: jest.fn() };

    const useCase = new GetTransactionUseCase(repository);
    const result = await useCase.execute('tx-1');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(transaction);
  });

  it('fails with NOT_FOUND when the transaction does not exist', async () => {
    const repository = { create: jest.fn(), findById: jest.fn().mockResolvedValue(null), save: jest.fn() };

    const useCase = new GetTransactionUseCase(repository);
    const result = await useCase.execute('missing');

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.NOT_FOUND);
  });
});
