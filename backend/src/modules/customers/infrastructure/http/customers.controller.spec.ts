import { HttpException } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { Customer } from '../../domain/customer.entity';
import { Result, DomainError } from '@shared/domain/result';

const dto = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phoneNumber: '+573000000000',
  documentType: 'CC',
  documentNumber: '123',
};

describe('CustomersController', () => {
  it('create returns the customer on success', async () => {
    const customer = new Customer('1', dto.fullName, dto.email, dto.phoneNumber, dto.documentType, dto.documentNumber);
    const useCase = { execute: jest.fn().mockResolvedValue(Result.ok(customer)) };

    const controller = new CustomersController(useCase as any);
    const response = await controller.create(dto);

    expect(response).toBe(customer);
  });

  it('create throws an HttpException when validation fails', async () => {
    const useCase = { execute: jest.fn().mockResolvedValue(Result.fail(DomainError.validation('bad'))) };
    const controller = new CustomersController(useCase as any);

    await expect(controller.create(dto)).rejects.toBeInstanceOf(HttpException);
  });
});
