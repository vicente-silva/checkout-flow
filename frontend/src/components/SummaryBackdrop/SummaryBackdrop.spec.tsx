import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithStore } from '@/test-utils';
import SummaryBackdrop from './SummaryBackdrop';
import { backendApi } from '@/api/backendApi';

jest.mock('@/api/backendApi', () => ({
  backendApi: { payTransaction: jest.fn() },
}));

const transaction = {
  id: 't1',
  reference: 'REF-1',
  productId: 'p1',
  customerId: 'c1',
  deliveryId: 'd1',
  quantity: 1,
  productAmountInCents: 1000000,
  baseFeeInCents: 500000,
  deliveryFeeInCents: 800000,
  amountInCents: 2300000,
  status: 'PENDING' as const,
  gatewayTransactionId: null,
  createdAt: '',
  updatedAt: '',
};

describe('SummaryBackdrop', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when there is no transaction', () => {
    const { container } = renderWithStore(<SummaryBackdrop />, { checkout: { transaction: null } as any });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the amount breakdown and card info', () => {
    renderWithStore(<SummaryBackdrop />, {
      checkout: { transaction, cardDisplay: { brand: 'visa', lastFour: '4242' } } as any,
    });

    expect(screen.getByText(/4242/)).toBeInTheDocument();
    expect(screen.getByText('Total a pagar')).toBeInTheDocument();
  });

  it('dispatches the payment on click and reaches FINAL_STATUS', async () => {
    (backendApi.payTransaction as jest.Mock).mockResolvedValue({ ...transaction, status: 'APPROVED' });

    const { store } = renderWithStore(<SummaryBackdrop />, {
      checkout: { transaction, cardToken: 'tok', acceptanceToken: 'acc' } as any,
    });

    fireEvent.click(screen.getByRole('button', { name: /pagar ahora/i }));

    await waitFor(() => expect(store.getState().checkout.step).toBe('FINAL_STATUS'));
    expect(backendApi.payTransaction).toHaveBeenCalledWith('t1', {
      cardToken: 'tok',
      acceptanceToken: 'acc',
      installments: 1,
    });
  });
});
