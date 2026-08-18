import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';
import { ProductTypeOrmRepository } from './infrastructure/persistence/product.typeorm.repository';
import { PRODUCT_REPOSITORY } from './domain/product.repository.port';
import { ProductsController } from './infrastructure/http/products.controller';
import { ListProductsUseCase } from './application/list-products.use-case';
import { GetProductUseCase } from './application/get-product.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductsController],
  providers: [
    ListProductsUseCase,
    GetProductUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: ProductTypeOrmRepository },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
