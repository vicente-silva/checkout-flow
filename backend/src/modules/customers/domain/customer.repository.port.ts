import { Customer } from './customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CreateCustomerData {
  fullName: string;
  email: string;
  phoneNumber: string;
  documentType: string;
  documentNumber: string;
}

export interface CustomerRepositoryPort {
  findByEmail(email: string): Promise<Customer | null>;
  findById(id: string): Promise<Customer | null>;
  create(data: CreateCustomerData): Promise<Customer>;
}
