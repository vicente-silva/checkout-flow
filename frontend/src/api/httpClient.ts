import axios from 'axios';
import { ENV } from '@/config/env';

export const httpClient = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

interface BackendErrorBody {
  message?: string;
}

interface WompiErrorBody {
  error?: {
    type?: string;
    reason?: string;
    messages?: Record<string, string[]>;
  };
}

/**
 * Understands both our own backend's error shape ({ message }) and Wompi's
 * ({ error: { type, messages: { field: [reason, ...] } } }), so a 422 from
 * either surfaces as a readable message instead of a silent console-only
 * failure.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;

  const body = error.response?.data as (BackendErrorBody & WompiErrorBody) | undefined;
  if (!body) return fallback;

  if (body.error?.messages) {
    const details = Object.entries(body.error.messages)
      .map(([field, reasons]) => `${field}: ${reasons.join(', ')}`)
      .join(' — ');
    if (details) return details;
  }
  if (body.error?.reason) return body.error.reason;
  if (body.message) return body.message;

  return fallback;
}
