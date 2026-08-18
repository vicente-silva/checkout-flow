import axios from 'axios';
import { extractErrorMessage } from './httpClient';

describe('extractErrorMessage', () => {
  beforeEach(() => {
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true as any);
  });

  it('returns the backend message from an axios error response', () => {
    const axiosError = { response: { data: { message: 'Product not found' } } };
    expect(extractErrorMessage(axiosError, 'fallback')).toBe('Product not found');
  });

  it('falls back when the error is not an axios error', () => {
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(false as any);
    expect(extractErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });

  it('falls back when the axios error has no message body', () => {
    expect(extractErrorMessage({ response: { data: {} } }, 'fallback')).toBe('fallback');
  });

  it('falls back when there is no response body at all', () => {
    expect(extractErrorMessage({ response: undefined }, 'fallback')).toBe('fallback');
  });

  it('formats Wompi validation errors (field -> reasons) into a readable message', () => {
    const wompiError = {
      response: {
        data: {
          error: {
            type: 'INPUT_VALIDATION_ERROR',
            messages: { card_holder: ['no debe contener menos de 5 caracteres'] },
          },
        },
      },
    };
    expect(extractErrorMessage(wompiError, 'fallback')).toBe(
      'card_holder: no debe contener menos de 5 caracteres',
    );
  });

  it('joins multiple Wompi field errors', () => {
    const wompiError = {
      response: {
        data: {
          error: {
            messages: {
              number: ['no es aceptado en el ambiente de pruebas'],
              cvc: ['es requerido'],
            },
          },
        },
      },
    };
    expect(extractErrorMessage(wompiError, 'fallback')).toBe(
      'number: no es aceptado en el ambiente de pruebas — cvc: es requerido',
    );
  });

  it('falls back to error.reason when there are no field messages', () => {
    const wompiError = { response: { data: { error: { reason: 'invalid_card' } } } };
    expect(extractErrorMessage(wompiError, 'fallback')).toBe('invalid_card');
  });
});
