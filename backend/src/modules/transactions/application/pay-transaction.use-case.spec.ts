import { PayTransactionUseCase } from './pay-transaction.use-case';
import { Transaction, TransactionStatus } from '../domain/transaction.entity';
import { GatewayTransactionStatus } from '../domain/payment-gateway.port';
import { Product } from '@modules/products/domain/product.entity';
import { Customer } from '@modules/customers/domain/customer.entity';
import { DomainErrorCode, Result, DomainError } from '@shared/domain/result';

function buildTransaction(status = TransactionStatus.PENDING): Transaction {
  return new Transaction(
    'tx-1',
    'REF-1',
    'product-1',
    'customer-1',
    'delivery-1',
    2,
    2000000,
    500000,
    800000,
    3300000,
    status,
    null,
    new Date(),
    new Date(),
  );
}

function buildDeps() {
  const transactionRepository = { create: jest.fn(), findById: jest.fn(), save: jest.fn() };
  const productRepository = { findAll: jest.fn(), findById: jest.fn(), save: jest.fn() };
  const customerRepository = { findByEmail: jest.fn(), findById: jest.fn(), create: jest.fn() };
  const paymentGateway = { createTransaction: jest.fn(), getTransactionStatus: jest.fn() };
  return { transactionRepository, productRepository, customerRepository, paymentGateway };
}

const customer = new Customer('customer-1', 'Jane', 'jane@example.com', '+573000000000', 'CC', '123');
const product = new Product('product-1', 'Widget', 'desc', 1000000, 'img', 'SKU-1', 5);

const payInput = {
  transactionId: 'tx-1',
  cardToken: 'tok_test',
  acceptanceToken: 'acc_test',
  installments: 1,
};

describe('PayTransactionUseCase', () => {
  it('approves the transaction, decreases stock and persists the final status', async () => {
    const deps = buildDeps();
    const transaction = buildTransaction();
    deps.transactionRepository.findById.mockResolvedValue(transaction);
    deps.customerRepository.findById.mockResolvedValue(customer);
    deps.productRepository.findById.mockResolvedValue(product);
    deps.paymentGateway.createTransaction.mockResolvedValue(
      Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.PENDING }),
    );
    deps.paymentGateway.getTransactionStatus.mockResolvedValue(
      Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.APPROVED }),
    );

    const useCase = new PayTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.paymentGateway,
    );
    jest.spyOn(useCase as any, 'sleep').mockResolvedValue(undefined);

    const result = await useCase.execute(payInput);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe(TransactionStatus.APPROVED);
    expect(deps.productRepository.save).toHaveBeenCalled();
    expect(product.stockQuantity).toBe(3); // 5 - quantity(2)
    expect(deps.transactionRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('does not touch stock when the gateway declines the payment', async () => {
    const deps = buildDeps();
    const transaction = buildTransaction();
    deps.transactionRepository.findById.mockResolvedValue(transaction);
    deps.customerRepository.findById.mockResolvedValue(customer);
    deps.paymentGateway.createTransaction.mockResolvedValue(
      Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.PENDING }),
    );
    deps.paymentGateway.getTransactionStatus.mockResolvedValue(
      Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.DECLINED }),
    );

    const useCase = new PayTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.paymentGateway,
    );
    jest.spyOn(useCase as any, 'sleep').mockResolvedValue(undefined);

    const result = await useCase.execute(payInput);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe(TransactionStatus.DECLINED);
    expect(deps.productRepository.findById).not.toHaveBeenCalled();
  });

  it('polls until a final status is reached', async () => {
    const deps = buildDeps();
    const transaction = buildTransaction();
    deps.transactionRepository.findById.mockResolvedValue(transaction);
    deps.customerRepository.findById.mockResolvedValue(customer);
    deps.paymentGateway.createTransaction.mockResolvedValue(
      Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.PENDING }),
    );
    deps.paymentGateway.getTransactionStatus
      .mockResolvedValueOnce(Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.PENDING }))
      .mockResolvedValueOnce(Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.PENDING }))
      .mockResolvedValueOnce(Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.APPROVED }));

    const useCase = new PayTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.paymentGateway,
    );
    jest.spyOn(useCase as any, 'sleep').mockResolvedValue(undefined);

    const result = await useCase.execute(payInput);

    expect(result.getValue().status).toBe(TransactionStatus.APPROVED);
    expect(deps.paymentGateway.getTransactionStatus).toHaveBeenCalledTimes(3);
  });

  it('marks the transaction as ERROR when polling times out', async () => {
    const deps = buildDeps();
    const transaction = buildTransaction();
    deps.transactionRepository.findById.mockResolvedValue(transaction);
    deps.customerRepository.findById.mockResolvedValue(customer);
    deps.paymentGateway.createTransaction.mockResolvedValue(
      Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.PENDING }),
    );
    deps.paymentGateway.getTransactionStatus.mockResolvedValue(
      Result.ok({ gatewayTransactionId: 'gtw-1', status: GatewayTransactionStatus.PENDING }),
    );

    const useCase = new PayTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.paymentGateway,
    );
    jest.spyOn(useCase as any, 'sleep').mockResolvedValue(undefined);

    const result = await useCase.execute(payInput);

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.PAYMENT_GATEWAY_ERROR);
    expect(transaction.status).toBe(TransactionStatus.ERROR);
  });

  it('marks the transaction as ERROR when the gateway rejects the initial request', async () => {
    const deps = buildDeps();
    const transaction = buildTransaction();
    deps.transactionRepository.findById.mockResolvedValue(transaction);
    deps.customerRepository.findById.mockResolvedValue(customer);
    deps.paymentGateway.createTransaction.mockResolvedValue(
      Result.fail(DomainError.paymentGateway('network error')),
    );

    const useCase = new PayTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.paymentGateway,
    );

    const result = await useCase.execute(payInput);

    expect(result.isFailure).toBe(true);
    expect(transaction.status).toBe(TransactionStatus.ERROR);
    expect(deps.transactionRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('fails with NOT_FOUND when the transaction does not exist', async () => {
    const deps = buildDeps();
    deps.transactionRepository.findById.mockResolvedValue(null);

    const useCase = new PayTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.paymentGateway,
    );

    const result = await useCase.execute(payInput);

    expect(result.getError().code).toBe(DomainErrorCode.NOT_FOUND);
  });

  it('fails with CONFLICT when the transaction is not PENDING anymore', async () => {
    const deps = buildDeps();
    deps.transactionRepository.findById.mockResolvedValue(buildTransaction(TransactionStatus.APPROVED));

    const useCase = new PayTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.paymentGateway,
    );

    const result = await useCase.execute(payInput);

    expect(result.getError().code).toBe(DomainErrorCode.CONFLICT);
  });

  it('fails with NOT_FOUND when the customer for the transaction is missing', async () => {
    const deps = buildDeps();
    deps.transactionRepository.findById.mockResolvedValue(buildTransaction());
    deps.customerRepository.findById.mockResolvedValue(null);

    const useCase = new PayTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.paymentGateway,
    );

    const result = await useCase.execute(payInput);

    expect(result.getError().code).toBe(DomainErrorCode.NOT_FOUND);
  });
});
