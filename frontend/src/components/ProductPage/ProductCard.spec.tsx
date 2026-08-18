import { screen, fireEvent } from '@testing-library/react';
import { renderWithStore } from '@/test-utils';
import ProductCard from './ProductCard';

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

describe('ProductCard', () => {
  it('renders the product and selects it on buy', () => {
    const { store } = renderWithStore(<ProductCard product={product} />);

    expect(screen.getByText('Reloj deportivo')).toBeInTheDocument();
    expect(screen.getByText(/3 disponibles/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /pagar con tarjeta/i }));

    const state = store.getState().checkout;
    expect(state.selectedProductId).toBe('p1');
    expect(state.quantity).toBe(1);
    expect(state.step).toBe('PAYMENT_INFO');
  });

  it('selects the chosen quantity', () => {
    const { store } = renderWithStore(<ProductCard product={product} />);

    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /pagar con tarjeta/i }));

    expect(store.getState().checkout.quantity).toBe(2);
  });

  it('disables buying when out of stock', () => {
    renderWithStore(<ProductCard product={{ ...product, stockQuantity: 0 }} />);

    expect(screen.getByRole('button', { name: /sin stock/i })).toBeDisabled();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });
});
