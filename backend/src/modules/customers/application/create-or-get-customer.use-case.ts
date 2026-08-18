import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@shared/domain/result';
import { Customer } from '../domain/customer.entity';
import {
  CreateCustomerData,
  CUSTOMER_REPOSITORY,
  CustomerRepositoryPort,
} from '../domain/customer.repository.port';

/**
 * Idempotent by email: real-life customers retry checkouts, so we don't
 * want to create duplicate customer rows for the same person.
 */
@Injectable()
export class CreateOrGetCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: CustomerRepositoryPort,
  ) {}

  async execute(data: CreateCustomerData): Promise<Result<Customer, DomainError>> {
    if (!isValidEmail(data.email)) {
      return Result.fail(DomainError.validation('Invalid email address'));
    }
    if (!data.fullName?.trim()) {
      return Result.fail(DomainError.validation('fullName is required'));
    }
    if (!data.documentNumber?.trim()) {
      return Result.fail(DomainError.validation('documentNumber is required'));
    }

    const existing = await this.customerRepository.findByEmail(data.email);
    if (existing) {
      return Result.ok(existing);
    }

    const created = await this.customerRepository.create(data);
    return Result.ok(created);
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '');
}
