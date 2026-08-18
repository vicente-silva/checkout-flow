import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithStore } from '@/test-utils';
import FinalStatusPage from './FinalStatusPage';
import { backendApi } from '@/api/backendApi';

jest.mock('@/api/backendApi', () => ({
  backendApi: { listProducts: jest.fn().mockResolvedValue([]) },
}));

const baseTransaction = {
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
  gatewayTransactionId: 'gtw-1',
  createdAt: '',
  updatedAt: '',
};

describe('FinalStatusPage', () => {
  it('renders nothing without a transaction', () => {
    const { container } = renderWithStore(<FinalStatusPage />, { checkout: { transaction: null } as any });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an approved message', () => {
    renderWithStore(<FinalStatusPage />, {
      checkout: { transaction: { ...baseTransaction, status: 'APPROVED' } } as any,
    });
    expect(screen.getByText('Pago aprobado')).toBeInTheDocument();
    expect(screen.getByText('REF-1')).toBeInTheDocument();
  });

  it('shows a declined message', () => {
    renderWithStore(<FinalStatusPage />, {
      checkout: { transaction: { ...baseTransaction, status: 'DECLINED' } } as any,
    });
    expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
  });

  it('resets the checkout and re-fetches products on click', async () => {
    const { store } = renderWithStore(<FinalStatusPage />, {
      checkout: {
        transaction: { ...baseTransaction, status: 'APPROVED' },
        selectedProductId: 'p1',
      } as any,
    });

    fireEvent.click(screen.getByRole('button', { name: /volver a la tienda/i }));

    expect(store.getState().checkout.transaction).toBeNull();
    expect(store.getState().checkout.step).toBe('PRODUCT');
    await waitFor(() => expect(backendApi.listProducts).toHaveBeenCalled());
  });
});
