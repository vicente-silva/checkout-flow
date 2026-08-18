import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithStore } from '@/test-utils';
import PaymentInfoModal from './PaymentInfoModal';
import { backendApi } from '@/api/backendApi';
import { fetchAcceptanceToken, tokenizeCard } from '@/api/wompiClient';

jest.mock('@/api/backendApi', () => ({
  backendApi: {
    createCustomer: jest.fn(),
    createDelivery: jest.fn(),
    createTransaction: jest.fn(),
  },
}));

jest.mock('@/api/wompiClient', () => ({
  tokenizeCard: jest.fn(),
  fetchAcceptanceToken: jest.fn(),
}));

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Número de tarjeta'), {
    target: { value: '4242424242424242' },
  });
  fireEvent.change(screen.getByLabelText('Nombre del titular'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText('Vencimiento (MM/AA)'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('Año de vencimiento'), { target: { value: '35' } });
  fireEvent.change(screen.getByLabelText('CVC'), { target: { value: '123' } });
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '+573001234567' } });
  fireEvent.change(screen.getByLabelText('Documento'), { target: { value: '1020304050' } });
  fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Cra 7 # 71-21' } });
  fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Bogota' } });
  fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'Cundinamarca' } });
  fireEvent.change(screen.getByLabelText('Código postal'), { target: { value: '110231' } });
}

describe('PaymentInfoModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('closes and returns to the product step', () => {
    const { store } = renderWithStore(<PaymentInfoModal />, {
      checkout: { step: 'PAYMENT_INFO' } as any,
    });

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

    expect(store.getState().checkout.step).toBe('PRODUCT');
  });

  it('shows validation errors and does not submit when the form is empty', () => {
    renderWithStore(<PaymentInfoModal />, { checkout: { step: 'PAYMENT_INFO' } as any });

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(screen.getByText('Número de tarjeta inválido')).toBeInTheDocument();
    expect(backendApi.createCustomer).not.toHaveBeenCalled();
  });

  it('detects the Visa brand as the user types the card number', () => {
    renderWithStore(<PaymentInfoModal />, { checkout: { step: 'PAYMENT_INFO' } as any });

    fireEvent.change(screen.getByLabelText('Número de tarjeta'), {
      target: { value: '4242424242424242' },
    });

    expect(screen.getByTestId('card-brand-visa')).toBeInTheDocument();
  });

  it('submits valid data and reaches the SUMMARY step', async () => {
    (tokenizeCard as jest.Mock).mockResolvedValue({ token: 'tok_1', brand: 'visa', lastFour: '4242' });
    (fetchAcceptanceToken as jest.Mock).mockResolvedValue({ acceptanceToken: 'acc_1', permalink: 'x' });
    (backendApi.createCustomer as jest.Mock).mockResolvedValue({ id: 'c1' });
    (backendApi.createDelivery as jest.Mock).mockResolvedValue({ id: 'd1' });
    (backendApi.createTransaction as jest.Mock).mockResolvedValue({ id: 't1', status: 'PENDING' });

    const { store } = renderWithStore(<PaymentInfoModal />, {
      checkout: { step: 'PAYMENT_INFO', selectedProductId: 'p1', quantity: 1 } as any,
    });

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => expect(store.getState().checkout.step).toBe('SUMMARY'));
    expect(backendApi.createTransaction).toHaveBeenCalledWith({
      productId: 'p1',
      customerId: 'c1',
      deliveryId: 'd1',
      quantity: 1,
    });
  });
});
