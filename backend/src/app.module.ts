import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from '@config/typeorm.config';
import { ProductsModule } from '@modules/products/products.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { DeliveriesModule } from '@modules/deliveries/deliveries.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    ProductsModule,
    CustomersModule,
    DeliveriesModule,
    TransactionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
