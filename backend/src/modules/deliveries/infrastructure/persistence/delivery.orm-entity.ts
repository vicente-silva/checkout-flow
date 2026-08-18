import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'deliveries' })
export class DeliveryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'address_line', type: 'varchar', length: 250 })
  addressLine: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  region: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ type: 'varchar', length: 60, default: 'Colombia' })
  country: string;

  @Column({ name: 'delivery_fee_in_cents', type: 'integer' })
  deliveryFeeInCents: number;
}
