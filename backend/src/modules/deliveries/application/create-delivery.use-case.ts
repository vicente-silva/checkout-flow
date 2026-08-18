import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@shared/domain/result';
import { Delivery } from '../domain/delivery.entity';
import {
  DELIVERY_REPOSITORY,
  DeliveryRepositoryPort,
} from '../domain/delivery.repository.port';
import { calculateDeliveryFeeInCents } from '../domain/delivery-fee.calculator';

export interface CreateDeliveryInput {
  customerId: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

@Injectable()
export class CreateDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepository: DeliveryRepositoryPort,
  ) {}

  async execute(input: CreateDeliveryInput): Promise<Result<Delivery, DomainError>> {
    if (!input.addressLine?.trim()) {
      return Result.fail(DomainError.validation('addressLine is required'));
    }
    if (!input.city?.trim()) {
      return Result.fail(DomainError.validation('city is required'));
    }
    if (!input.customerId?.trim()) {
      return Result.fail(DomainError.validation('customerId is required'));
    }

    const deliveryFeeInCents = calculateDeliveryFeeInCents(input.city);
    const delivery = await this.deliveryRepository.create({ ...input, deliveryFeeInCents });
    return Result.ok(delivery);
  }
}
