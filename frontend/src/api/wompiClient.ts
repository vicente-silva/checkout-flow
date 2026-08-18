import axios from 'axios';
import { ENV } from '@/config/env';

/**
 * Talks to Wompi directly from the browser using the *public* key only.
 * This is what keeps card data (PAN/CVC) out of our backend entirely: the
 * card is tokenized here, and only the resulting token is ever sent to
 * our API (see api/backendApi.ts -> payTransaction).
 */
const wompiClient = axios.create({
  baseURL: ENV.wompiSandboxUrl,
  timeout: 15_000,
});

export interface AcceptanceTokenInfo {
  acceptanceToken: string;
  permalink: string;
}

export interface TokenizeCardInput {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export interface CardTokenInfo {
  token: string;
  brand: string;
  lastFour: string;
}

export async function fetchAcceptanceToken(): Promise<AcceptanceTokenInfo> {
  const { data } = await wompiClient.get(`/merchants/${ENV.wompiPublicKey}`);
  const presigned = data?.data?.presigned_acceptance;
  return {
    acceptanceToken: presigned?.acceptance_token ?? '',
    permalink: presigned?.permalink ?? '',
  };
}

export async function tokenizeCard(input: TokenizeCardInput): Promise<CardTokenInfo> {
  const { data } = await wompiClient.post(
    '/tokens/cards',
    {
      number: input.number.replace(/\s+/g, ''),
      cvc: input.cvc,
      exp_month: input.expMonth,
      exp_year: input.expYear,
      card_holder: input.cardHolder,
    },
    { headers: { Authorization: `Bearer ${ENV.wompiPublicKey}` } },
  );

  return {
    token: data.data.id,
    brand: data.data.brand,
    lastFour: data.data.last_four,
  };
}
