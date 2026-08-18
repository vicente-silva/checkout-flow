import { Delivery } from './delivery.entity';

export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');

export interface CreateDeliveryData {
  customerId: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  deliveryFeeInCents: number;
}

export interface DeliveryRepositoryPort {
  findById(id: string): Promise<Delivery | null>;
  create(data: CreateDeliveryData): Promise<Delivery>;
}
