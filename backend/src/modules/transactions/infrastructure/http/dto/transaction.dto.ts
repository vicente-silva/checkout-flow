import { ApiProperty } from '@nestjs/swagger';
import { Transaction, TransactionStatus } from '../../../domain/transaction.entity';

export class TransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  deliveryId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  productAmountInCents: number;

  @ApiProperty()
  baseFeeInCents: number;

  @ApiProperty()
  deliveryFeeInCents: number;

  @ApiProperty()
  amountInCents: number;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ nullable: true })
  gatewayTransactionId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(transaction: Transaction): TransactionDto {
    const dto = new TransactionDto();
    dto.id = transaction.id;
    dto.reference = transaction.reference;
    dto.productId = transaction.productId;
    dto.customerId = transaction.customerId;
    dto.deliveryId = transaction.deliveryId;
    dto.quantity = transaction.quantity;
    dto.productAmountInCents = transaction.productAmountInCents;
    dto.baseFeeInCents = transaction.baseFeeInCents;
    dto.deliveryFeeInCents = transaction.deliveryFeeInCents;
    dto.amountInCents = transaction.amountInCents;
    dto.status = transaction.status;
    dto.gatewayTransactionId = transaction.gatewayTransactionId;
    dto.createdAt = transaction.createdAt;
    dto.updatedAt = transaction.updatedAt;
    return dto;
  }
}
