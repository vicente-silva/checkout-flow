import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../../domain/delivery.entity';
import {
  CreateDeliveryData,
  DeliveryRepositoryPort,
} from '../../domain/delivery.repository.port';
import { DeliveryOrmEntity } from './delivery.orm-entity';

@Injectable()
export class DeliveryTypeOrmRepository implements DeliveryRepositoryPort {
  constructor(
    @InjectRepository(DeliveryOrmEntity)
    private readonly repository: Repository<DeliveryOrmEntity>,
  ) {}

  async findById(id: string): Promise<Delivery | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateDeliveryData): Promise<Delivery> {
    const row = this.repository.create(data);
    const saved = await this.repository.save(row);
    return toDomain(saved);
  }
}

function toDomain(row: DeliveryOrmEntity): Delivery {
  return new Delivery(
    row.id,
    row.customerId,
    row.addressLine,
    row.city,
    row.region,
    row.postalCode,
    row.country,
    row.deliveryFeeInCents,
  );
}
