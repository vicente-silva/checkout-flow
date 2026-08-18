import { CreateOrGetCustomerUseCase } from './create-or-get-customer.use-case';
import { CustomerRepositoryPort } from '../domain/customer.repository.port';
import { Customer } from '../domain/customer.entity';
import { DomainErrorCode } from '@shared/domain/result';

function buildRepository(overrides: Partial<jest.Mocked<CustomerRepositoryPort>> = {}) {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    findById: jest.fn(),
    create: jest.fn(),
    ...overrides,
  } as jest.Mocked<CustomerRepositoryPort>;
}

const validInput = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phoneNumber: '+573001234567',
  documentType: 'CC',
  documentNumber: '1020304050',
};

describe('CreateOrGetCustomerUseCase', () => {
  it('creates a new customer when none exists for that email', async () => {
    const created = new Customer('1', validInput.fullName, validInput.email, validInput.phoneNumber, 'CC', '1020304050');
    const repository = buildRepository({ create: jest.fn().mockResolvedValue(created) });

    const useCase = new CreateOrGetCustomerUseCase(repository);
    const result = await useCase.execute(validInput);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(created);
    expect(repository.create).toHaveBeenCalledWith(validInput);
  });

  it('returns the existing customer without creating a duplicate', async () => {
    const existing = new Customer('1', validInput.fullName, validInput.email, validInput.phoneNumber, 'CC', '1020304050');
    const repository = buildRepository({ findByEmail: jest.fn().mockResolvedValue(existing) });

    const useCase = new CreateOrGetCustomerUseCase(repository);
    const result = await useCase.execute(validInput);

    expect(result.getValue()).toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('fails validation for an invalid email', async () => {
    const useCase = new CreateOrGetCustomerUseCase(buildRepository());
    const result = await useCase.execute({ ...validInput, email: 'not-an-email' });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.VALIDATION_ERROR);
  });

  it('fails validation when fullName is blank', async () => {
    const useCase = new CreateOrGetCustomerUseCase(buildRepository());
    const result = await useCase.execute({ ...validInput, fullName: '   ' });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.VALIDATION_ERROR);
  });

  it('fails validation when documentNumber is blank', async () => {
    const useCase = new CreateOrGetCustomerUseCase(buildRepository());
    const result = await useCase.execute({ ...validInput, documentNumber: '' });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe(DomainErrorCode.VALIDATION_ERROR);
  });
});
