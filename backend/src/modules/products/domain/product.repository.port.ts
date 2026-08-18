import { Product } from './product.entity';

/**
 * Port (in hexagonal architecture terms): the application layer depends on
 * this interface only. Infrastructure provides the adapter (TypeORM, in
 * this project).
 */
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepositoryPort {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  /** Persists the current stockQuantity for the product. */
  save(product: Product): Promise<void>;
}
