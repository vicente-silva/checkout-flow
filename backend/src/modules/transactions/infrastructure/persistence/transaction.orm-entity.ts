import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TransactionStatus } from '../../domain/transaction.entity';

@Entity({ name: 'transactions' })
export class TransactionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  reference: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'delivery_id', type: 'uuid' })
  deliveryId: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'product_amount_in_cents', type: 'integer' })
  productAmountInCents: number;

  @Column({ name: 'base_fee_in_cents', type: 'integer' })
  baseFeeInCents: number;

  @Column({ name: 'delivery_fee_in_cents', type: 'integer' })
  deliveryFeeInCents: number;

  @Column({ name: 'amount_in_cents', type: 'integer' })
  amountInCents: number;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ name: 'gateway_transaction_id', type: 'varchar', length: 100, nullable: true })
  gatewayTransactionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
