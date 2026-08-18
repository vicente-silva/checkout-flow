import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@shared/domain/result';
import { Product } from '../domain/product.entity';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../domain/product.repository.port';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(): Promise<Result<Product[], DomainError>> {
    const products = await this.productRepository.findAll();
    return Result.ok(products);
  }
}
