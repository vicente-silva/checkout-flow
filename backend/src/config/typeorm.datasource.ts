import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ORM_ENTITIES } from './typeorm.config';

/**
 * Standalone DataSource used only by the TypeORM CLI (migration:generate /
 * migration:run), which cannot rely on the Nest DI container.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'checkout',
  password: process.env.DB_PASSWORD ?? 'checkout',
  database: process.env.DB_DATABASE ?? 'checkout_db',
  entities: ORM_ENTITIES,
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
});
