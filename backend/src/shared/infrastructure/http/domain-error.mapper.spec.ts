import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@shared/domain/result';
import { httpStatusForDomainError, toErrorBody } from './domain-error.mapper';

describe('domain-error.mapper', () => {
  it.each([
    [DomainError.validation('bad input'), HttpStatus.BAD_REQUEST],
    [DomainError.notFound('missing'), HttpStatus.NOT_FOUND],
    [DomainError.conflict('duplicate'), HttpStatus.CONFLICT],
    [DomainError.outOfStock('no stock'), HttpStatus.UNPROCESSABLE_ENTITY],
    [DomainError.paymentGateway('gateway down'), HttpStatus.BAD_GATEWAY],
    [DomainError.unexpected('boom'), HttpStatus.INTERNAL_SERVER_ERROR],
  ])('maps %j to %s', (error, expectedStatus) => {
    expect(httpStatusForDomainError(error)).toBe(expectedStatus);
  });

  it('builds a serializable error body', () => {
    const error = DomainError.validation('bad input', { field: 'email' });
    expect(toErrorBody(error)).toEqual({
      code: error.code,
      message: 'bad input',
      details: { field: 'email' },
    });
  });
});
