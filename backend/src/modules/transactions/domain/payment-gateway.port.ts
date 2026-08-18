import { Result, DomainError } from '@shared/domain/result';

export enum GatewayTransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
  VOIDED = 'VOIDED',
}

export interface GatewayTransactionResult {
  gatewayTransactionId: string;
  status: GatewayTransactionStatus;
}

export interface CreateGatewayTransactionInput {
  amountInCents: number;
  currency: string;
  customerEmail: string;
  reference: string;
  cardToken: string;
  installments: number;
  acceptanceToken: string;
}

/**
 * Port: the application layer only knows about this contract. The concrete
 * adapter (WompiPaymentAdapter) lives in infrastructure and can be swapped
 * (e.g. for a fake gateway in tests) without touching use cases.
 */
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface PaymentGatewayPort {
  createTransaction(
    input: CreateGatewayTransactionInput,
  ): Promise<Result<GatewayTransactionResult, DomainError>>;

  getTransactionStatus(
    gatewayTransactionId: string,
  ): Promise<Result<GatewayTransactionResult, DomainError>>;
}
