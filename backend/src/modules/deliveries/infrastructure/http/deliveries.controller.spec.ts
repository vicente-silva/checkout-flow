import { HttpException } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { Delivery } from '../../domain/delivery.entity';
import { Result, DomainError } from '@shared/domain/result';

const dto = {
  customerId: 'customer-1',
  addressLine: 'Cra 7',
  city: 'Bogota',
  region: 'Cundinamarca',
  postalCode: '110231',
};

describe('DeliveriesController', () => {
  it('create defaults country to Colombia and returns the delivery', async () => {
    const delivery = new Delivery('1', 'customer-1', 'Cra 7', 'Bogota', 'Cundinamarca', '110231', 'Colombia', 800000);
    const useCase = { execute: jest.fn().mockResolvedValue(Result.ok(delivery)) };

    const controller = new DeliveriesController(useCase as any);
    const response = await controller.create(dto as any);

    expect(useCase.execute).toHaveBeenCalledWith({ ...dto, country: 'Colombia' });
    expect(response).toBe(delivery);
  });

  it('throws an HttpException when the use case fails', async () => {
    const useCase = { execute: jest.fn().mockResolvedValue(Result.fail(DomainError.validation('bad'))) };
    const controller = new DeliveriesController(useCase as any);

    await expect(controller.create(dto as any)).rejects.toBeInstanceOf(HttpException);
  });
});
