import { screen, waitFor } from '@testing-library/react';
import { renderWithStore } from '@/test-utils';
import App from './App';
import { backendApi } from '@/api/backendApi';

jest.mock('@/api/backendApi', () => ({
  backendApi: { listProducts: jest.fn().mockResolvedValue([]) },
}));

describe('App', () => {
  it('fetches products on mount and shows the ProductPage by default', async () => {
    renderWithStore(<App />);
    expect(screen.getByText('Tienda Checkout')).toBeInTheDocument();
    await waitFor(() => expect(backendApi.listProducts).toHaveBeenCalled());
  });

  it('shows the payment modal during PAYMENT_INFO', () => {
    renderWithStore(<App />, { checkout: { step: 'PAYMENT_INFO' } as any });
    expect(screen.getByRole('dialog', { name: /datos de pago/i })).toBeInTheDocument();
  });

  it('shows the summary backdrop during SUMMARY', () => {
    renderWithStore(<App />, {
      checkout: {
        step: 'SUMMARY',
        transaction: {
          id: 't1',
          reference: 'REF-1',
          amountInCents: 100,
          productAmountInCents: 50,
          baseFeeInCents: 30,
          deliveryFeeInCents: 20,
        },
      } as any,
    });
    expect(screen.getByRole('dialog', { name: /resumen de pago/i })).toBeInTheDocument();
  });

  it('shows the final status page during FINAL_STATUS', () => {
    renderWithStore(<App />, {
      checkout: {
        step: 'FINAL_STATUS',
        transaction: {
          id: 't1',
          reference: 'REF-1',
          amountInCents: 100,
          status: 'APPROVED',
        },
      } as any,
    });
    expect(screen.getByText('Pago aprobado')).toBeInTheDocument();
  });
});
