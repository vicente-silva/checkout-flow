import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Result, DomainError } from '@shared/domain/result';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '@modules/products/domain/product.repository.port';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepositoryPort,
} from '@modules/customers/domain/customer.repository.port';
import {
  DELIVERY_REPOSITORY,
  DeliveryRepositoryPort,
} from '@modules/deliveries/domain/delivery.repository.port';
import { Transaction, TransactionStatus } from '../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepositoryPort,
} from '../domain/transaction.repository.port';

export interface CreateTransactionInput {
  productId: string;
  customerId: string;
  deliveryId: string;
  quantity: number;
}

/**
 * Step 1 of the payment flow: creates the transaction in PENDING status
 * and returns a transaction reference, *before* any call to Wompi is made.
 * This is what lets the client show "processing" state and survive a
 * refresh: the transaction already exists server-side.
 */
@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepositoryPort,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: CustomerRepositoryPort,
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepository: DeliveryRepositoryPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: CreateTransactionInput): Promise<Result<Transaction, DomainError>> {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      return Result.fail(DomainError.validation('quantity must be a positive integer'));
    }

    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      return Result.fail(DomainError.notFound(`Product ${input.productId} was not found`));
    }
    if (!product.hasStockFor(input.quantity)) {
      return Result.fail(
        DomainError.outOfStock(
          `Only ${product.stockQuantity} unit(s) of ${product.name} are available`,
        ),
      );
    }

    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) {
      return Result.fail(DomainError.notFound(`Customer ${input.customerId} was not found`));
    }

    const delivery = await this.deliveryRepository.findById(input.deliveryId);
    if (!delivery) {
      return Result.fail(DomainError.notFound(`Delivery ${input.deliveryId} was not found`));
    }
    if (delivery.customerId !== customer.id) {
      return Result.fail(
        DomainError.validation('The delivery does not belong to the given customer'),
      );
    }

    const productAmountInCents = product.priceInCents * input.quantity;
    const baseFeeInCents = Number(this.configService.get<string>('BASE_FEE_CENTS', '500000'));
    const deliveryFeeInCents = delivery.deliveryFeeInCents;
    const amountInCents = productAmountInCents + baseFeeInCents + deliveryFeeInCents;

    const transaction = await this.transactionRepository.create({
      reference: buildReference(),
      productId: product.id,
      customerId: customer.id,
      deliveryId: delivery.id,
      quantity: input.quantity,
      productAmountInCents,
      baseFeeInCents,
      deliveryFeeInCents,
      amountInCents,
      status: TransactionStatus.PENDING,
    });

    return Result.ok(transaction);
  }
}

function buildReference(): string {
  return `CHK-${Date.now()}-${randomUUID().slice(0, 8)}`;
}
