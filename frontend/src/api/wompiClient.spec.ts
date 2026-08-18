const get = jest.fn();
const post = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn(() => ({ get, post })) },
}));

// Imported after the mock so the module-level `axios.create()` call picks it up.
import { fetchAcceptanceToken, tokenizeCard } from './wompiClient';

describe('wompiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchAcceptanceToken reads the presigned acceptance token', async () => {
    get.mockResolvedValue({
      data: { data: { presigned_acceptance: { acceptance_token: 'acc_1', permalink: 'http://x' } } },
    });

    const result = await fetchAcceptanceToken();

    expect(result).toEqual({ acceptanceToken: 'acc_1', permalink: 'http://x' });
  });

  it('fetchAcceptanceToken tolerates a missing payload', async () => {
    get.mockResolvedValue({ data: {} });
    const result = await fetchAcceptanceToken();
    expect(result).toEqual({ acceptanceToken: '', permalink: '' });
  });

  it('tokenizeCard strips spaces from the card number and maps the response', async () => {
    post.mockResolvedValue({ data: { data: { id: 'tok_1', brand: 'VISA', last_four: '4242' } } });

    const result = await tokenizeCard({
      number: '4242 4242 4242 4242',
      cvc: '123',
      expMonth: '12',
      expYear: '30',
      cardHolder: 'Jane Doe',
    });

    expect(post).toHaveBeenCalledWith(
      '/tokens/cards',
      expect.objectContaining({ number: '4242424242424242', cvc: '123' }),
      expect.any(Object),
    );
    expect(result).toEqual({ token: 'tok_1', brand: 'VISA', lastFour: '4242' });
  });
});
