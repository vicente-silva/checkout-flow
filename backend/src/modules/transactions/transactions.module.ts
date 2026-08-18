import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '@modules/products/products.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { DeliveriesModule } from '@modules/deliveries/deliveries.module';
import { TransactionOrmEntity } from './infrastructure/persistence/transaction.orm-entity';
import { TransactionTypeOrmRepository } from './infrastructure/persistence/transaction.typeorm.repository';
import { TRANSACTION_REPOSITORY } from './domain/transaction.repository.port';
import { PAYMENT_GATEWAY } from './domain/payment-gateway.port';
import { WompiPaymentAdapter } from './infrastructure/payment/wompi-payment.adapter';
import { TransactionsController } from './infrastructure/http/transactions.controller';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { PayTransactionUseCase } from './application/pay-transaction.use-case';
import { GetTransactionUseCase } from './application/get-transaction.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionOrmEntity]),
    ProductsModule,
    CustomersModule,
    DeliveriesModule,
  ],
  controllers: [TransactionsController],
  providers: [
    CreateTransactionUseCase,
    PayTransactionUseCase,
    GetTransactionUseCase,
    { provide: TRANSACTION_REPOSITORY, useClass: TransactionTypeOrmRepository },
    { provide: PAYMENT_GATEWAY, useClass: WompiPaymentAdapter },
  ],
})
export class TransactionsModule {}
