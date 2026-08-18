import { ListProductsUseCase } from './list-products.use-case';
import { ProductRepositoryPort } from '../domain/product.repository.port';
import { Product } from '../domain/product.entity';

describe('ListProductsUseCase', () => {
  it('returns all products from the repository', async () => {
    const products = [new Product('1', 'A', 'desc', 1000, 'img', 'SKU-A', 5)];
    const repository: jest.Mocked<ProductRepositoryPort> = {
      findAll: jest.fn().mockResolvedValue(products),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const useCase = new ListProductsUseCase(repository);
    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(products);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });
});
