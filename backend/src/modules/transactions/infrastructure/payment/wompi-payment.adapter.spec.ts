import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { WompiPaymentAdapter } from './wompi-payment.adapter';
import { GatewayTransactionStatus } from '../../domain/payment-gateway.port';
import { DomainErrorCode } from '@shared/domain/result';

jest.mock('axios');

describe('WompiPaymentAdapter', () => {
  const post = jest.fn();
  const get = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (axios.create as jest.Mock).mockReturnValue({ post, get });
    (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);
  });

  function buildAdapter(): WompiPaymentAdapter {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          WOMPI_SANDBOX_URL: 'https://api-sandbox.example/v1',
          WOMPI_PRIVATE_KEY: 'prv_test',
          WOMPI_INTEGRITY_KEY: 'integrity_secret_test',
        };
        return values[key] ?? '';
      }),
    } as unknown as ConfigService;
    return new WompiPaymentAdapter(configService);
  }

  it('creates a transaction and maps the gateway status', async () => {
    post.mockResolvedValue({ data: { data: { id: 'gtw-1', status: 'PENDING' } } });
    const adapter = buildAdapter();

    const result = await adapter.createTransaction({
      amountInCents: 100000,
      currency: 'COP',
      customerEmail: 'jane@example.com',
      reference: 'REF-1',
      cardToken: 'tok_test',
      installments: 1,
      acceptanceToken: 'acc_test',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual({
      gatewayTransactionId: 'gtw-1',
      status: GatewayTransactionStatus.PENDING,
    });
    const expectedSignature = createHash('sha256')
      .update('REF-1100000COPintegrity_secret_test')
      .digest('hex');

    expect(post).toHaveBeenCalledWith(
      '/transactions',
      expect.objectContaining({
        amount_in_cents: 100000,
        currency: 'COP',
        customer_email: 'jane@example.com',
        reference: 'REF-1',
        acceptance_token: 'acc_test',
        signature: expectedSignature,
        payment_method: { type: 'CARD', installments: 1, token: 'tok_test' },
      }),
    );
  });

  it('fails with PAYMENT_GATEWAY_ERROR when the create call rejects', async () => {
    post.mockRejectedValue(new Error('network down'));
    const adapter = buildAdapter();

    const result = await adapter.createTransaction({
      amountInCents: 100000,
      currency: 'COP',
      customerEmail: 'jane@example.com',
      reference: 'REF-1',
      cardToken: 'tok_test',
      installments: 1,
      acceptanceToken: 'acc_test',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.PAYMENT_GATEWAY_ERROR);
  });

  it('fetches the transaction status and maps APPROVED', async () => {
    get.mockResolvedValue({ data: { data: { id: 'gtw-1', status: 'APPROVED' } } });
    const adapter = buildAdapter();

    const result = await adapter.getTransactionStatus('gtw-1');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe(GatewayTransactionStatus.APPROVED);
    expect(get).toHaveBeenCalledWith('/transactions/gtw-1');
  });

  it('fails with PAYMENT_GATEWAY_ERROR when the status call rejects', async () => {
    get.mockRejectedValue(new Error('timeout'));
    const adapter = buildAdapter();

    const result = await adapter.getTransactionStatus('gtw-1');

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.PAYMENT_GATEWAY_ERROR);
  });

  it('maps an unknown Wompi status to ERROR', async () => {
    get.mockResolvedValue({ data: { data: { id: 'gtw-1', status: 'SOMETHING_NEW' } } });
    const adapter = buildAdapter();

    const result = await adapter.getTransactionStatus('gtw-1');

    expect(result.getValue().status).toBe(GatewayTransactionStatus.ERROR);
  });
});
