import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryOrmEntity } from './infrastructure/persistence/delivery.orm-entity';
import { DeliveryTypeOrmRepository } from './infrastructure/persistence/delivery.typeorm.repository';
import { DELIVERY_REPOSITORY } from './domain/delivery.repository.port';
import { DeliveriesController } from './infrastructure/http/deliveries.controller';
import { CreateDeliveryUseCase } from './application/create-delivery.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryOrmEntity])],
  controllers: [DeliveriesController],
  providers: [
    CreateDeliveryUseCase,
    { provide: DELIVERY_REPOSITORY, useClass: DeliveryTypeOrmRepository },
  ],
  exports: [DELIVERY_REPOSITORY],
})
export class DeliveriesModule {}
