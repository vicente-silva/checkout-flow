import { screen, fireEvent } from '@testing-library/react';
import { renderWithStore } from '@/test-utils';
import ProductPage from './ProductPage';

const product = {
  id: 'p1',
  name: 'Reloj deportivo',
  description: 'Un reloj',
  priceInCents: 1000000,
  imageUrl: 'http://img',
  sku: 'SKU-1',
  stockQuantity: 3,
  inStock: true,
};

describe('ProductPage', () => {
  it('shows a loading state', () => {
    renderWithStore(<ProductPage />, { products: { items: [], status: 'loading', error: null } });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an error state', () => {
    renderWithStore(<ProductPage />, {
      products: { items: [], status: 'failed', error: 'network down' },
    });
    expect(screen.getByText('network down')).toBeInTheDocument();
  });

  it('shows an empty state when there are no products', () => {
    renderWithStore(<ProductPage />, { products: { items: [], status: 'succeeded', error: null } });
    expect(screen.getByText(/no hay productos/i)).toBeInTheDocument();
  });

  it('renders the product and enables buying', () => {
    const { store } = renderWithStore(<ProductPage />, {
      products: { items: [product], status: 'succeeded', error: null },
    });

    expect(screen.getByText('Reloj deportivo')).toBeInTheDocument();
    expect(screen.getByText(/3 disponibles/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /pagar con tarjeta/i }));

    const state = store.getState().checkout;
    expect(state.selectedProductId).toBe('p1');
    expect(state.step).toBe('PAYMENT_INFO');
  });

  it('disables buying when out of stock', () => {
    renderWithStore(<ProductPage />, {
      products: { items: [{ ...product, stockQuantity: 0 }], status: 'succeeded', error: null },
    });

    expect(screen.getByRole('button', { name: /sin stock/i })).toBeDisabled();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });
});
