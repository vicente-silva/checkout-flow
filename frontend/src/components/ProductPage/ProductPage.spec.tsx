import { screen } from '@testing-library/react';
import { renderWithStore } from '@/test-utils';
import ProductPage from './ProductPage';

const products = [
  {
    id: 'p1',
    name: 'Reloj deportivo',
    description: 'Un reloj',
    priceInCents: 1000000,
    imageUrl: 'http://img',
    sku: 'SKU-1',
    stockQuantity: 3,
    inStock: true,
  },
  {
    id: 'p2',
    name: 'Audífonos',
    description: 'Buen sonido',
    priceInCents: 500000,
    imageUrl: 'http://img2',
    sku: 'SKU-2',
    stockQuantity: 5,
    inStock: true,
  },
];

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

  it('renders every product in the catalog, not just the first one', () => {
    renderWithStore(<ProductPage />, {
      products: { items: products, status: 'succeeded', error: null },
    });

    expect(screen.getByText('Reloj deportivo')).toBeInTheDocument();
    expect(screen.getByText('Audífonos')).toBeInTheDocument();
  });
});
