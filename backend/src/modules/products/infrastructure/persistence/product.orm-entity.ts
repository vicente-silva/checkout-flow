import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'products' })
export class ProductOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'price_in_cents', type: 'integer' })
  priceInCents: number;

  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  sku: string;

  @Column({ name: 'stock_quantity', type: 'integer', default: 0 })
  stockQuantity: number;
}
