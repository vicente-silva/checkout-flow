/**
 * Result<T, E> implements the Railway Oriented Programming pattern.
 *
 * A use case never throws for expected/business failures; it returns a
 * Result that is either `ok` (the "success track") or `fail` (the "failure
 * track"). Callers chain `.map` / `.flatMap` to keep composing on the
 * success track, and the failure short-circuits automatically — the same
 * way exceptions short-circuit a try/catch, but fully typed and without
 * throwing for expected domain errors.
 */
export class Result<T, E = DomainError> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T, E = DomainError>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  static fail<T = never, E = DomainError>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  /** Throws if called on a failed Result. Use only after checking isSuccess. */
  getValue(): T {
    if (!this._isSuccess) {
      throw new Error(
        `Cannot get the value of a failed result. Error: ${JSON.stringify(this._error)}`,
      );
    }
    return this._value as T;
  }

  getError(): E {
    return this._error as E;
  }

  /** Transforms the success value, propagating failures untouched. */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) return Result.fail<U, E>(this._error as E);
    return Result.ok<U, E>(fn(this._value as T));
  }

  /** Chains another Result-returning step (a.k.a. bind / andThen). */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) return Result.fail<U, E>(this._error as E);
    return fn(this._value as T);
  }

  /** Async variant of flatMap, for chaining awaited use-case steps. */
  async flatMapAsync<U>(fn: (value: T) => Promise<Result<U, E>>): Promise<Result<U, E>> {
    if (this.isFailure) return Result.fail<U, E>(this._error as E);
    return fn(this._value as T);
  }

  /** Runs one of two callbacks and returns their (unified) result. */
  match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
    return this._isSuccess ? onSuccess(this._value as T) : onFailure(this._error as E);
  }
}

export enum DomainErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

export class DomainError {
  private constructor(
    public readonly code: DomainErrorCode,
    public readonly message: string,
    public readonly details?: unknown,
  ) {}

  static validation(message: string, details?: unknown): DomainError {
    return new DomainError(DomainErrorCode.VALIDATION_ERROR, message, details);
  }

  static notFound(message: string, details?: unknown): DomainError {
    return new DomainError(DomainErrorCode.NOT_FOUND, message, details);
  }

  static conflict(message: string, details?: unknown): DomainError {
    return new DomainError(DomainErrorCode.CONFLICT, message, details);
  }

  static outOfStock(message: string, details?: unknown): DomainError {
    return new DomainError(DomainErrorCode.OUT_OF_STOCK, message, details);
  }

  static paymentGateway(message: string, details?: unknown): DomainError {
    return new DomainError(DomainErrorCode.PAYMENT_GATEWAY_ERROR, message, details);
  }

  static unexpected(message: string, details?: unknown): DomainError {
    return new DomainError(DomainErrorCode.UNEXPECTED_ERROR, message, details);
  }
}
