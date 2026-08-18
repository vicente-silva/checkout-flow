import { HttpStatus } from '@nestjs/common';
import { DomainError, DomainErrorCode } from '@shared/domain/result';

const STATUS_BY_CODE: Record<DomainErrorCode, HttpStatus> = {
  [DomainErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [DomainErrorCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainErrorCode.CONFLICT]: HttpStatus.CONFLICT,
  [DomainErrorCode.OUT_OF_STOCK]: HttpStatus.UNPROCESSABLE_ENTITY,
  [DomainErrorCode.PAYMENT_GATEWAY_ERROR]: HttpStatus.BAD_GATEWAY,
  [DomainErrorCode.UNEXPECTED_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
};

/** Maps a DomainError (failure track of a Result) to the HTTP status it should render as. */
export function httpStatusForDomainError(error: DomainError): HttpStatus {
  return STATUS_BY_CODE[error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
}

export function toErrorBody(error: DomainError) {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
  };
}
