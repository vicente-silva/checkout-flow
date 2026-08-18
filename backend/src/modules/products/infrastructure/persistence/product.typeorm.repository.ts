import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../domain/product.entity';
import { ProductRepositoryPort } from '../../domain/product.repository.port';
import { ProductOrmEntity } from './product.orm-entity';

@Injectable()
export class ProductTypeOrmRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.repository.find({ order: { name: 'ASC' } });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async save(product: Product): Promise<void> {
    await this.repository.update(product.id, { stockQuantity: product.stockQuantity });
  }
}

function toDomain(row: ProductOrmEntity): Product {
  return new Product(
    row.id,
    row.name,
    row.description,
    row.priceInCents,
    row.imageUrl,
    row.sku,
    row.stockQuantity,
  );
}
