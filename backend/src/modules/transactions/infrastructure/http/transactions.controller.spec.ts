import { HttpException } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { Transaction, TransactionStatus } from '../../domain/transaction.entity';
import { Result, DomainError } from '@shared/domain/result';

function buildTransaction(): Transaction {
  return new Transaction(
    'tx-1', 'REF-1', 'p1', 'c1', 'd1', 1, 100000, 5000, 8000, 113000,
    TransactionStatus.PENDING, null, new Date(), new Date(),
  );
}

describe('TransactionsController', () => {
  function buildController(overrides: {
    create?: any;
    pay?: any;
    get?: any;
  } = {}) {
    const createUseCase = { execute: overrides.create ?? jest.fn() };
    const payUseCase = { execute: overrides.pay ?? jest.fn() };
    const getUseCase = { execute: overrides.get ?? jest.fn() };
    return new TransactionsController(createUseCase as any, payUseCase as any, getUseCase as any);
  }

  it('create returns a TransactionDto on success', async () => {
    const transaction = buildTransaction();
    const controller = buildController({ create: jest.fn().mockResolvedValue(Result.ok(transaction)) });

    const response = await controller.create({
      productId: 'p1',
      customerId: 'c1',
      deliveryId: 'd1',
      quantity: 1,
    });

    expect(response.id).toBe('tx-1');
    expect(response.status).toBe(TransactionStatus.PENDING);
  });

  it('create throws an HttpException on failure', async () => {
    const controller = buildController({
      create: jest.fn().mockResolvedValue(Result.fail(DomainError.outOfStock('no stock'))),
    });

    await expect(
      controller.create({ productId: 'p1', customerId: 'c1', deliveryId: 'd1', quantity: 1 }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('pay returns the updated TransactionDto', async () => {
    const transaction = buildTransaction();
    transaction.markWith(TransactionStatus.APPROVED, 'gtw-1');
    const controller = buildController({ pay: jest.fn().mockResolvedValue(Result.ok(transaction)) });

    const response = await controller.pay('tx-1', {
      cardToken: 'tok',
      acceptanceToken: 'acc',
      installments: 1,
    });

    expect(response.status).toBe(TransactionStatus.APPROVED);
    expect(response.gatewayTransactionId).toBe('gtw-1');
  });

  it('pay throws an HttpException on failure', async () => {
    const controller = buildController({
      pay: jest.fn().mockResolvedValue(Result.fail(DomainError.conflict('already paid'))),
    });

    await expect(
      controller.pay('tx-1', { cardToken: 'tok', acceptanceToken: 'acc', installments: 1 }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('getById returns a TransactionDto', async () => {
    const transaction = buildTransaction();
    const controller = buildController({ get: jest.fn().mockResolvedValue(Result.ok(transaction)) });

    const response = await controller.getById('tx-1');

    expect(response.reference).toBe('REF-1');
  });

  it('getById throws an HttpException when not found', async () => {
    const controller = buildController({ get: jest.fn().mockResolvedValue(Result.fail(DomainError.notFound('nope'))) });

    await expect(controller.getById('missing')).rejects.toBeInstanceOf(HttpException);
  });
});
