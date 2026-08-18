import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../domain/customer.entity';
import {
  CreateCustomerData,
  CustomerRepositoryPort,
} from '../../domain/customer.repository.port';
import { CustomerOrmEntity } from './customer.orm-entity';

@Injectable()
export class CustomerTypeOrmRepository implements CustomerRepositoryPort {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repository: Repository<CustomerOrmEntity>,
  ) {}

  async findByEmail(email: string): Promise<Customer | null> {
    const row = await this.repository.findOne({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<Customer | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const row = this.repository.create(data);
    const saved = await this.repository.save(row);
    return toDomain(saved);
  }
}

function toDomain(row: CustomerOrmEntity): Customer {
  return new Customer(
    row.id,
    row.fullName,
    row.email,
    row.phoneNumber,
    row.documentType,
    row.documentNumber,
  );
}
