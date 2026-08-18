import { HttpException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { Product } from '../../domain/product.entity';
import { Result, DomainError } from '@shared/domain/result';

describe('ProductsController', () => {
  it('list maps domain products to DTOs', async () => {
    const products = [new Product('1', 'A', 'desc', 1000, 'img', 'SKU-A', 5)];
    const listUseCase = { execute: jest.fn().mockResolvedValue(Result.ok(products)) };
    const getUseCase = { execute: jest.fn() };

    const controller = new ProductsController(listUseCase as any, getUseCase as any);
    const response = await controller.list();

    expect(response).toEqual([
      { id: '1', name: 'A', description: 'desc', priceInCents: 1000, imageUrl: 'img', sku: 'SKU-A', stockQuantity: 5, inStock: true },
    ]);
  });

  it('getById returns a DTO on success', async () => {
    const product = new Product('1', 'A', 'desc', 1000, 'img', 'SKU-A', 0);
    const listUseCase = { execute: jest.fn() };
    const getUseCase = { execute: jest.fn().mockResolvedValue(Result.ok(product)) };

    const controller = new ProductsController(listUseCase as any, getUseCase as any);
    const response = await controller.getById('1');

    expect(response.inStock).toBe(false);
  });

  it('getById throws an HttpException when the use case fails', async () => {
    const listUseCase = { execute: jest.fn() };
    const getUseCase = { execute: jest.fn().mockResolvedValue(Result.fail(DomainError.notFound('nope'))) };

    const controller = new ProductsController(listUseCase as any, getUseCase as any);

    await expect(controller.getById('missing')).rejects.toBeInstanceOf(HttpException);
  });
});
