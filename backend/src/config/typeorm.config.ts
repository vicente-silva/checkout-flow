import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ProductOrmEntity } from '@modules/products/infrastructure/persistence/product.orm-entity';
import { CustomerOrmEntity } from '@modules/customers/infrastructure/persistence/customer.orm-entity';
import { DeliveryOrmEntity } from '@modules/deliveries/infrastructure/persistence/delivery.orm-entity';
import { TransactionOrmEntity } from '@modules/transactions/infrastructure/persistence/transaction.orm-entity';

export const ORM_ENTITIES = [
  ProductOrmEntity,
  CustomerOrmEntity,
  DeliveryOrmEntity,
  TransactionOrmEntity,
];

export function buildTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'checkout'),
    password: configService.get<string>('DB_PASSWORD', 'checkout'),
    database: configService.get<string>('DB_DATABASE', 'checkout_db'),
    entities: ORM_ENTITIES,
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    // Never true in production: schema changes must go through migrations.
    synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
    autoLoadEntities: false,
  };
}
