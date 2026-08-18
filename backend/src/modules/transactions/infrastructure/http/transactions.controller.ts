import { Body, Controller, Get, HttpException, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Result, DomainError } from '@shared/domain/result';
import { httpStatusForDomainError, toErrorBody } from '@shared/infrastructure/http/domain-error.mapper';
import { Transaction } from '../../domain/transaction.entity';
import { CreateTransactionUseCase } from '../../application/create-transaction.use-case';
import { PayTransactionUseCase } from '../../application/pay-transaction.use-case';
import { GetTransactionUseCase } from '../../application/get-transaction.use-case';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PayTransactionDto } from './dto/pay-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly payTransactionUseCase: PayTransactionUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a PENDING transaction and reserve pricing for a checkout' })
  @ApiCreatedResponse({ type: TransactionDto })
  async create(@Body() dto: CreateTransactionDto): Promise<TransactionDto> {
    const result = await this.createTransactionUseCase.execute(dto);
    return this.respondOrThrow(result);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Charge a PENDING transaction through Wompi and settle stock/status' })
  @ApiOkResponse({ type: TransactionDto })
  async pay(@Param('id') id: string, @Body() dto: PayTransactionDto): Promise<TransactionDto> {
    const result = await this.payTransactionUseCase.execute({ transactionId: id, ...dto });
    return this.respondOrThrow(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get the current status of a transaction' })
  @ApiOkResponse({ type: TransactionDto })
  async getById(@Param('id') id: string): Promise<TransactionDto> {
    const result = await this.getTransactionUseCase.execute(id);
    return this.respondOrThrow(result);
  }

  private respondOrThrow(result: Result<Transaction, DomainError>): TransactionDto {
    return result.match(
      (transaction) => TransactionDto.fromDomain(transaction),
      (error) => {
        throw new HttpException(toErrorBody(error), httpStatusForDomainError(error));
      },
    );
  }
}
