import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@shared/domain/result';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '@modules/products/domain/product.repository.port';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepositoryPort,
} from '@modules/customers/domain/customer.repository.port';
import { Transaction, TransactionStatus } from '../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepositoryPort,
} from '../domain/transaction.repository.port';
import {
  GatewayTransactionStatus,
  PAYMENT_GATEWAY,
  PaymentGatewayPort,
} from '../domain/payment-gateway.port';

export interface PayTransactionInput {
  transactionId: string;
  cardToken: string;
  acceptanceToken: string;
  installments: number;
}

const GATEWAY_TO_LOCAL_STATUS: Record<GatewayTransactionStatus, TransactionStatus> = {
  [GatewayTransactionStatus.PENDING]: TransactionStatus.PENDING,
  [GatewayTransactionStatus.APPROVED]: TransactionStatus.APPROVED,
  [GatewayTransactionStatus.DECLINED]: TransactionStatus.DECLINED,
  [GatewayTransactionStatus.ERROR]: TransactionStatus.ERROR,
  [GatewayTransactionStatus.VOIDED]: TransactionStatus.VOIDED,
};

const POLL_MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 1500;

/**
 * Step 2 of the payment flow: calls Wompi to actually charge the card,
 * polls until a final status is reached, then — on the success track —
 * updates the local transaction, decreases stock and assigns the product
 * for delivery. Every step is expressed as Result so a failure at any
 * point short-circuits without throwing.
 */
@Injectable()
export class PayTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepositoryPort,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: CustomerRepositoryPort,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(input: PayTransactionInput): Promise<Result<Transaction, DomainError>> {
    const transaction = await this.transactionRepository.findById(input.transactionId);
    if (!transaction) {
      return Result.fail(DomainError.notFound(`Transaction ${input.transactionId} was not found`));
    }
    if (!transaction.isPending()) {
      return Result.fail(
        DomainError.conflict(`Transaction ${transaction.id} is already ${transaction.status}`),
      );
    }

    const customer = await this.customerRepository.findById(transaction.customerId);
    if (!customer) {
      return Result.fail(DomainError.notFound(`Customer ${transaction.customerId} was not found`));
    }

    const created = await this.paymentGateway.createTransaction({
      amountInCents: transaction.amountInCents,
      currency: 'COP',
      customerEmail: customer.email,
      reference: transaction.reference,
      cardToken: input.cardToken,
      installments: input.installments,
      acceptanceToken: input.acceptanceToken,
    });

    if (created.isFailure) {
      // Wompi never registered an attempt for this reference (the request
      // itself was rejected — bad token, validation error, network issue),
      // so nothing needs to be reconciled. Leave the transaction PENDING
      // rather than burning it as ERROR, so the customer can just retry.
      return Result.fail(created.getError());
    }

    const resolved = await this.pollUntilFinal(created.getValue().gatewayTransactionId);
    if (resolved.isFailure) {
      transaction.markWith(TransactionStatus.ERROR, created.getValue().gatewayTransactionId);
      await this.transactionRepository.save(transaction);
      return Result.fail(resolved.getError());
    }

    const finalResult = resolved.getValue();
    transaction.markWith(
      GATEWAY_TO_LOCAL_STATUS[finalResult.status],
      finalResult.gatewayTransactionId,
    );
    await this.transactionRepository.save(transaction);

    if (transaction.status === TransactionStatus.APPROVED) {
      const product = await this.productRepository.findById(transaction.productId);
      if (product && product.hasStockFor(transaction.quantity)) {
        product.decreaseStock(transaction.quantity);
        await this.productRepository.save(product);
      }
    }

    return Result.ok(transaction);
  }

  private async pollUntilFinal(
    gatewayTransactionId: string,
  ): Promise<Result<{ gatewayTransactionId: string; status: GatewayTransactionStatus }, DomainError>> {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
      const statusResult = await this.paymentGateway.getTransactionStatus(gatewayTransactionId);
      if (statusResult.isFailure) {
        return Result.fail(statusResult.getError());
      }

      const value = statusResult.getValue();
      if (value.status !== GatewayTransactionStatus.PENDING) {
        return Result.ok(value);
      }

      if (attempt < POLL_MAX_ATTEMPTS - 1) {
        await this.sleep(POLL_INTERVAL_MS);
      }
    }

    return Result.fail(
      DomainError.paymentGateway('Timed out waiting for a final status from the payment gateway'),
    );
  }

  /**
   * Isolated as an instance method (rather than a free function) so tests
   * can `jest.spyOn(useCase, 'sleep').mockResolvedValue(undefined)` and
   * exercise the full retry loop, including the timeout path, instantly.
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
