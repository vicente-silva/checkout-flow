import { GetProductUseCase } from './get-product.use-case';
import { ProductRepositoryPort } from '../domain/product.repository.port';
import { Product } from '../domain/product.entity';
import { DomainErrorCode } from '@shared/domain/result';

describe('GetProductUseCase', () => {
  function buildRepository(product: Product | null): jest.Mocked<ProductRepositoryPort> {
    return {
      findAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(product),
      save: jest.fn(),
    };
  }

  it('returns the product when it exists', async () => {
    const product = new Product('1', 'A', 'desc', 1000, 'img', 'SKU-A', 5);
    const useCase = new GetProductUseCase(buildRepository(product));

    const result = await useCase.execute('1');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(product);
  });

  it('fails with NOT_FOUND when the product does not exist', async () => {
    const useCase = new GetProductUseCase(buildRepository(null));

    const result = await useCase.execute('missing-id');

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.NOT_FOUND);
  });
});
