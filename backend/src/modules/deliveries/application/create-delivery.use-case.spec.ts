import { CreateDeliveryUseCase } from './create-delivery.use-case';
import { DeliveryRepositoryPort } from '../domain/delivery.repository.port';
import { Delivery } from '../domain/delivery.entity';
import { DomainErrorCode } from '@shared/domain/result';

function buildRepository(overrides: Partial<jest.Mocked<DeliveryRepositoryPort>> = {}) {
  return {
    findById: jest.fn(),
    create: jest.fn(),
    ...overrides,
  } as jest.Mocked<DeliveryRepositoryPort>;
}

const validInput = {
  customerId: 'customer-1',
  addressLine: 'Cra 7 # 71-21',
  city: 'Bogota',
  region: 'Cundinamarca',
  postalCode: '110231',
  country: 'Colombia',
};

describe('CreateDeliveryUseCase', () => {
  it('creates a delivery with the computed fee for the city', async () => {
    const created = new Delivery('d1', 'customer-1', validInput.addressLine, 'Bogota', 'Cundinamarca', '110231', 'Colombia', 800000);
    const repository = buildRepository({ create: jest.fn().mockResolvedValue(created) });

    const useCase = new CreateDeliveryUseCase(repository);
    const result = await useCase.execute(validInput);

    expect(result.isSuccess).toBe(true);
    expect(repository.create).toHaveBeenCalledWith({ ...validInput, deliveryFeeInCents: 800000 });
    expect(result.getValue()).toBe(created);
  });

  it('fails validation when addressLine is missing', async () => {
    const useCase = new CreateDeliveryUseCase(buildRepository());
    const result = await useCase.execute({ ...validInput, addressLine: '' });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.VALIDATION_ERROR);
  });

  it('fails validation when city is missing', async () => {
    const useCase = new CreateDeliveryUseCase(buildRepository());
    const result = await useCase.execute({ ...validInput, city: '' });

    expect(result.isFailure).toBe(true);
  });

  it('fails validation when customerId is missing', async () => {
    const useCase = new CreateDeliveryUseCase(buildRepository());
    const result = await useCase.execute({ ...validInput, customerId: '' });

    expect(result.isFailure).toBe(true);
  });
});
