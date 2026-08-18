import { ConfigService } from '@nestjs/config';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { Product } from '@modules/products/domain/product.entity';
import { Customer } from '@modules/customers/domain/customer.entity';
import { Delivery } from '@modules/deliveries/domain/delivery.entity';
import { Transaction, TransactionStatus } from '../domain/transaction.entity';
import { DomainErrorCode } from '@shared/domain/result';

function buildDeps() {
  const transactionRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  };
  const productRepository = { findAll: jest.fn(), findById: jest.fn(), save: jest.fn() };
  const customerRepository = { findByEmail: jest.fn(), findById: jest.fn(), create: jest.fn() };
  const deliveryRepository = { findById: jest.fn(), create: jest.fn() };
  const configService = { get: jest.fn().mockReturnValue('500000') } as unknown as ConfigService;

  return { transactionRepository, productRepository, customerRepository, deliveryRepository, configService };
}

const product = new Product('product-1', 'Widget', 'desc', 1000000, 'img', 'SKU-1', 5);
const customer = new Customer('customer-1', 'Jane', 'jane@example.com', '+573000000000', 'CC', '123');
const delivery = new Delivery('delivery-1', 'customer-1', 'Cra 7', 'Bogota', 'Cundinamarca', '110231', 'Colombia', 800000);

describe('CreateTransactionUseCase', () => {
  it('creates a PENDING transaction with amounts computed from product, base fee and delivery fee', async () => {
    const deps = buildDeps();
    deps.productRepository.findById.mockResolvedValue(product);
    deps.customerRepository.findById.mockResolvedValue(customer);
    deps.deliveryRepository.findById.mockResolvedValue(delivery);
    const createdTransaction = {} as Transaction;
    deps.transactionRepository.create.mockResolvedValue(createdTransaction);

    const useCase = new CreateTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.deliveryRepository,
      deps.configService,
    );

    const result = await useCase.execute({
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      quantity: 2,
    });

    expect(result.isSuccess).toBe(true);
    expect(deps.transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'product-1',
        customerId: 'customer-1',
        deliveryId: 'delivery-1',
        quantity: 2,
        productAmountInCents: 2000000,
        baseFeeInCents: 500000,
        deliveryFeeInCents: 800000,
        amountInCents: 2000000 + 500000 + 800000,
        status: TransactionStatus.PENDING,
      }),
    );
  });

  it('fails when quantity is not a positive integer', async () => {
    const deps = buildDeps();
    const useCase = new CreateTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.deliveryRepository,
      deps.configService,
    );

    const result = await useCase.execute({
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      quantity: 0,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.VALIDATION_ERROR);
  });

  it('fails with NOT_FOUND when the product does not exist', async () => {
    const deps = buildDeps();
    deps.productRepository.findById.mockResolvedValue(null);
    const useCase = new CreateTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.deliveryRepository,
      deps.configService,
    );

    const result = await useCase.execute({
      productId: 'missing',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      quantity: 1,
    });

    expect(result.getError().code).toBe(DomainErrorCode.NOT_FOUND);
  });

  it('fails with OUT_OF_STOCK when there is not enough stock', async () => {
    const deps = buildDeps();
    deps.productRepository.findById.mockResolvedValue(product);
    const useCase = new CreateTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.deliveryRepository,
      deps.configService,
    );

    const result = await useCase.execute({
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      quantity: 999,
    });

    expect(result.getError().code).toBe(DomainErrorCode.OUT_OF_STOCK);
  });

  it('fails with NOT_FOUND when the customer does not exist', async () => {
    const deps = buildDeps();
    deps.productRepository.findById.mockResolvedValue(product);
    deps.customerRepository.findById.mockResolvedValue(null);
    const useCase = new CreateTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.deliveryRepository,
      deps.configService,
    );

    const result = await useCase.execute({
      productId: 'product-1',
      customerId: 'missing',
      deliveryId: 'delivery-1',
      quantity: 1,
    });

    expect(result.getError().code).toBe(DomainErrorCode.NOT_FOUND);
  });

  it('fails with NOT_FOUND when the delivery does not exist', async () => {
    const deps = buildDeps();
    deps.productRepository.findById.mockResolvedValue(product);
    deps.customerRepository.findById.mockResolvedValue(customer);
    deps.deliveryRepository.findById.mockResolvedValue(null);
    const useCase = new CreateTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.deliveryRepository,
      deps.configService,
    );

    const result = await useCase.execute({
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'missing',
      quantity: 1,
    });

    expect(result.getError().code).toBe(DomainErrorCode.NOT_FOUND);
  });

  it('fails validation when the delivery belongs to a different customer', async () => {
    const deps = buildDeps();
    const otherDelivery = new Delivery('delivery-2', 'someone-else', 'Cra 7', 'Bogota', 'Cundinamarca', '110231', 'Colombia', 800000);
    deps.productRepository.findById.mockResolvedValue(product);
    deps.customerRepository.findById.mockResolvedValue(customer);
    deps.deliveryRepository.findById.mockResolvedValue(otherDelivery);
    const useCase = new CreateTransactionUseCase(
      deps.transactionRepository,
      deps.productRepository,
      deps.customerRepository,
      deps.deliveryRepository,
      deps.configService,
    );

    const result = await useCase.execute({
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-2',
      quantity: 1,
    });

    expect(result.getError().code).toBe(DomainErrorCode.VALIDATION_ERROR);
  });
});
