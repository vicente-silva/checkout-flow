import axios from 'axios';
import { extractErrorMessage } from './httpClient';

describe('extractErrorMessage', () => {
  it('returns the backend message from an axios error response', () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { message: 'Product not found' } },
    };
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true as any);

    expect(extractErrorMessage(axiosError, 'fallback')).toBe('Product not found');
  });

  it('falls back when the error is not an axios error', () => {
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(false as any);
    expect(extractErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });

  it('falls back when the axios error has no message body', () => {
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true as any);
    expect(extractErrorMessage({ response: { data: {} } }, 'fallback')).toBe('fallback');
  });
});
