import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Result, DomainError } from '@shared/domain/result';
import {
  CreateGatewayTransactionInput,
  GatewayTransactionResult,
  GatewayTransactionStatus,
  PaymentGatewayPort,
} from '../../domain/payment-gateway.port';

interface WompiTransactionResponse {
  data: {
    id: string;
    status: string;
  };
}

const WOMPI_TO_GATEWAY_STATUS: Record<string, GatewayTransactionStatus> = {
  PENDING: GatewayTransactionStatus.PENDING,
  APPROVED: GatewayTransactionStatus.APPROVED,
  DECLINED: GatewayTransactionStatus.DECLINED,
  ERROR: GatewayTransactionStatus.ERROR,
  VOIDED: GatewayTransactionStatus.VOIDED,
};

/**
 * Adapter for the Wompi sandbox (UAT) API. Card data itself never reaches
 * this backend: the frontend tokenizes the card directly against Wompi
 * using the *public* key, and only the resulting token arrives here. This
 * adapter uses the *private* key, kept server-side only, to actually
 * create and query the charge.
 * Docs: https://docs.wompi.co/docs/colombia/inicio-rapido/
 */
@Injectable()
export class WompiPaymentAdapter implements PaymentGatewayPort {
  private readonly logger = new Logger(WompiPaymentAdapter.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('WOMPI_SANDBOX_URL'),
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('WOMPI_PRIVATE_KEY')}`,
      },
    });
  }

  async createTransaction(
    input: CreateGatewayTransactionInput,
  ): Promise<Result<GatewayTransactionResult, DomainError>> {
    try {
      const response = await this.client.post<WompiTransactionResponse>('/transactions', {
        amount_in_cents: input.amountInCents,
        currency: input.currency,
        customer_email: input.customerEmail,
        reference: input.reference,
        acceptance_token: input.acceptanceToken,
        payment_method: {
          type: 'CARD',
          installments: input.installments,
          token: input.cardToken,
        },
      });

      return Result.ok(this.toResult(response.data));
    } catch (error) {
      return Result.fail(this.toGatewayError('create the transaction', error));
    }
  }

  async getTransactionStatus(
    gatewayTransactionId: string,
  ): Promise<Result<GatewayTransactionResult, DomainError>> {
    try {
      const response = await this.client.get<WompiTransactionResponse>(
        `/transactions/${gatewayTransactionId}`,
      );
      return Result.ok(this.toResult(response.data));
    } catch (error) {
      return Result.fail(this.toGatewayError('fetch the transaction status', error));
    }
  }

  private toResult(payload: WompiTransactionResponse): GatewayTransactionResult {
    return {
      gatewayTransactionId: payload.data.id,
      status: WOMPI_TO_GATEWAY_STATUS[payload.data.status] ?? GatewayTransactionStatus.ERROR,
    };
  }

  private toGatewayError(action: string, error: unknown): DomainError {
    const details = axios.isAxiosError(error) ? error.response?.data : undefined;
    this.logger.error(`Wompi call failed while trying to ${action}`, details ?? error);
    return DomainError.paymentGateway(`Unable to ${action} with Wompi`, details);
  }
}
