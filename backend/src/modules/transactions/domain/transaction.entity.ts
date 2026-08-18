export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
  VOIDED = 'VOIDED',
}

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly reference: string,
    public readonly productId: string,
    public readonly customerId: string,
    public readonly deliveryId: string,
    public readonly quantity: number,
    public readonly productAmountInCents: number,
    public readonly baseFeeInCents: number,
    public readonly deliveryFeeInCents: number,
    public readonly amountInCents: number,
    public status: TransactionStatus,
    public gatewayTransactionId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  isFinal(): boolean {
    return this.status !== TransactionStatus.PENDING;
  }

  markWith(status: TransactionStatus, gatewayTransactionId: string | null): void {
    this.status = status;
    this.gatewayTransactionId = gatewayTransactionId;
    this.updatedAt = new Date();
  }
}
