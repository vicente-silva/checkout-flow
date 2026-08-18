import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ProductOrmEntity } from '@modules/products/infrastructure/persistence/product.orm-entity';
import { ORM_ENTITIES } from '@config/typeorm.config';

const DUMMY_PRODUCTS: Array<Omit<ProductOrmEntity, 'id'>> = [
  {
    sku: 'WATCH-SPORT-001',
    name: 'Reloj deportivo AeroFit',
    description:
      'Reloj inteligente resistente al agua, monitor de ritmo cardiaco y GPS integrado.',
    priceInCents: 25000000,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    stockQuantity: 12,
  },
  {
    sku: 'HEADPHONES-NC-002',
    name: 'Audífonos inalámbricos NoiseAway',
    description: 'Cancelación activa de ruido, 30 horas de batería y estuche de carga rápida.',
    priceInCents: 18000000,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    stockQuantity: 20,
  },
  {
    sku: 'BACKPACK-URB-003',
    name: 'Mochila urbana TrailPack',
    description: 'Compartimento acolchado para laptop de 15", puerto USB y material impermeable.',
    priceInCents: 9500000,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
    stockQuantity: 30,
  },
  {
    sku: 'SPEAKER-BT-004',
    name: 'Parlante portátil BassWave',
    description: 'Sonido 360°, resistente a salpicaduras (IPX5) y 12 horas de autonomía.',
    priceInCents: 12000000,
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
    stockQuantity: 0,
  },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'checkout',
    password: process.env.DB_PASSWORD ?? 'checkout',
    database: process.env.DB_DATABASE ?? 'checkout_db',
    entities: ORM_ENTITIES,
  });

  await dataSource.initialize();
  const repository = dataSource.getRepository(ProductOrmEntity);

  for (const product of DUMMY_PRODUCTS) {
    const existing = await repository.findOne({ where: { sku: product.sku } });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`Skipping ${product.sku}, already seeded`);
      continue;
    }
    await repository.save(repository.create(product));
    // eslint-disable-next-line no-console
    console.log(`Seeded ${product.sku}`);
  }

  await dataSource.destroy();
}

seed()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error);
    process.exit(1);
  });
