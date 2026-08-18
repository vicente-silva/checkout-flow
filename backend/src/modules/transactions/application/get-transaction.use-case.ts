import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@shared/domain/result';
import { Transaction } from '../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepositoryPort,
} from '../domain/transaction.repository.port';

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(transactionId: string): Promise<Result<Transaction, DomainError>> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      return Result.fail(DomainError.notFound(`Transaction ${transactionId} was not found`));
    }
    return Result.ok(transaction);
  }
}
