import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@shared/domain/result';
import { Product } from '../domain/product.entity';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../domain/product.repository.port';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(productId: string): Promise<Result<Product, DomainError>> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return Result.fail(DomainError.notFound(`Product ${productId} was not found`));
    }
    return Result.ok(product);
  }
}
