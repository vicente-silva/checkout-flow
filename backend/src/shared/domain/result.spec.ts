import { DomainError, DomainErrorCode, Result } from './result';

describe('Result (Railway Oriented Programming)', () => {
  it('creates a successful result carrying a value', () => {
    const result = Result.ok<number>(42);

    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBe(42);
  });

  it('creates a failed result carrying an error', () => {
    const error = DomainError.notFound('missing');
    const result = Result.fail<number>(error);

    expect(result.isFailure).toBe(true);
    expect(result.isSuccess).toBe(false);
    expect(result.getError()).toBe(error);
  });

  it('throws when reading the value of a failed result', () => {
    const result = Result.fail<number>(DomainError.notFound('missing'));
    expect(() => result.getValue()).toThrow();
  });

  it('map transforms the success value and leaves failures untouched', () => {
    const ok = Result.ok<number>(2).map((v) => v * 10);
    expect(ok.getValue()).toBe(20);

    const error = DomainError.validation('bad');
    const fail = Result.fail<number>(error).map((v) => v * 10);
    expect(fail.isFailure).toBe(true);
    expect(fail.getError()).toBe(error);
  });

  it('flatMap chains Result-returning steps and short-circuits on failure', () => {
    const doubleIfPositive = (v: number) =>
      v > 0 ? Result.ok(v * 2) : Result.fail<number>(DomainError.validation('must be positive'));

    expect(Result.ok(3).flatMap(doubleIfPositive).getValue()).toBe(6);

    const failed = Result.ok(-1).flatMap(doubleIfPositive);
    expect(failed.isFailure).toBe(true);
    expect(failed.getError().code).toBe(DomainErrorCode.VALIDATION_ERROR);

    const alreadyFailed = Result.fail<number>(DomainError.notFound('x')).flatMap(doubleIfPositive);
    expect(alreadyFailed.getError().code).toBe(DomainErrorCode.NOT_FOUND);
  });

  it('flatMapAsync chains an async Result-returning step', async () => {
    const asyncStep = async (v: number) => Result.ok(v + 1);

    const result = await Result.ok(1).flatMapAsync(asyncStep);
    expect(result.getValue()).toBe(2);

    const failure = await Result.fail<number>(DomainError.conflict('c')).flatMapAsync(asyncStep);
    expect(failure.isFailure).toBe(true);
  });

  it('match runs the success or failure branch', () => {
    const successOutcome = Result.ok<number>(5).match(
      (v) => `ok:${v}`,
      (e) => `fail:${e.message}`,
    );
    expect(successOutcome).toBe('ok:5');

    const failureOutcome = Result.fail<number>(DomainError.outOfStock('none left')).match(
      (v) => `ok:${v}`,
      (e) => `fail:${e.message}`,
    );
    expect(failureOutcome).toBe('fail:none left');
  });

  describe('DomainError factories', () => {
    it.each([
      ['validation', DomainErrorCode.VALIDATION_ERROR],
      ['notFound', DomainErrorCode.NOT_FOUND],
      ['conflict', DomainErrorCode.CONFLICT],
      ['outOfStock', DomainErrorCode.OUT_OF_STOCK],
      ['paymentGateway', DomainErrorCode.PAYMENT_GATEWAY_ERROR],
      ['unexpected', DomainErrorCode.UNEXPECTED_ERROR],
    ] as const)('%s builds a DomainError with code %s', (factory, code) => {
      const error = (DomainError[factory] as (msg: string) => DomainError)('message');
      expect(error.code).toBe(code);
      expect(error.message).toBe('message');
    });
  });
});
