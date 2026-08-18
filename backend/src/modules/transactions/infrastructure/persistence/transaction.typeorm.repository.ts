import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../domain/transaction.entity';
import {
  CreateTransactionData,
  TransactionRepositoryPort,
} from '../../domain/transaction.repository.port';
import { TransactionOrmEntity } from './transaction.orm-entity';

@Injectable()
export class TransactionTypeOrmRepository implements TransactionRepositoryPort {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repository: Repository<TransactionOrmEntity>,
  ) {}

  async create(data: CreateTransactionData): Promise<Transaction> {
    const row = this.repository.create({ ...data, gatewayTransactionId: null });
    const saved = await this.repository.save(row);
    return toDomain(saved);
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async save(transaction: Transaction): Promise<void> {
    await this.repository.update(transaction.id, {
      status: transaction.status,
      gatewayTransactionId: transaction.gatewayTransactionId,
      updatedAt: transaction.updatedAt,
    });
  }
}

function toDomain(row: TransactionOrmEntity): Transaction {
  return new Transaction(
    row.id,
    row.reference,
    row.productId,
    row.customerId,
    row.deliveryId,
    row.quantity,
    row.productAmountInCents,
    row.baseFeeInCents,
    row.deliveryFeeInCents,
    row.amountInCents,
    row.status,
    row.gatewayTransactionId,
    row.createdAt,
    row.updatedAt,
  );
}
