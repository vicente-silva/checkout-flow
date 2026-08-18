import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrmEntity } from './infrastructure/persistence/customer.orm-entity';
import { CustomerTypeOrmRepository } from './infrastructure/persistence/customer.typeorm.repository';
import { CUSTOMER_REPOSITORY } from './domain/customer.repository.port';
import { CustomersController } from './infrastructure/http/customers.controller';
import { CreateOrGetCustomerUseCase } from './application/create-or-get-customer.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomersController],
  providers: [
    CreateOrGetCustomerUseCase,
    { provide: CUSTOMER_REPOSITORY, useClass: CustomerTypeOrmRepository },
  ],
  exports: [CUSTOMER_REPOSITORY],
})
export class CustomersModule {}
