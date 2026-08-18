import { configureStore } from '@reduxjs/toolkit';
import reducer, {
  backToProductStep,
  openPaymentInfoStep,
  payCurrentTransaction,
  resetCheckout,
  selectProduct,
  submitCheckoutInfo,
} from './checkoutSlice';
import { backendApi } from '@/api/backendApi';
import { fetchAcceptanceToken, tokenizeCard } from '@/api/wompiClient';

jest.mock('@/api/backendApi', () => ({
  backendApi: {
    createCustomer: jest.fn(),
    createDelivery: jest.fn(),
    createTransaction: jest.fn(),
    payTransaction: jest.fn(),
  },
}));

jest.mock('@/api/wompiClient', () => ({
  tokenizeCard: jest.fn(),
  fetchAcceptanceToken: jest.fn(),
}));

function buildStore() {
  return configureStore({ reducer: { checkout: reducer } });
}

const customerForm = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phoneNumber: '+573000000000',
  documentType: 'CC',
  documentNumber: '123',
};

const deliveryForm = {
  addressLine: 'Cra 7',
  city: 'Bogota',
  region: 'Cundinamarca',
  postalCode: '110231',
};

const cardForm = {
  number: '4242424242424242',
  cvc: '123',
  expMonth: '12',
  expYear: '35',
  cardHolder: 'Jane Doe',
};

describe('checkoutSlice reducers', () => {
  it('selectProduct stores the product id and quantity', () => {
    const state = reducer(undefined, selectProduct({ productId: 'p1', quantity: 2 }));
    expect(state.selectedProductId).toBe('p1');
    expect(state.quantity).toBe(2);
  });

  it('openPaymentInfoStep moves to PAYMENT_INFO and clears errors', () => {
    const state = reducer({ ...reducer(undefined, { type: 'init' }), error: 'boom' }, openPaymentInfoStep());
    expect(state.step).toBe('PAYMENT_INFO');
    expect(state.error).toBeNull();
  });

  it('backToProductStep moves to PRODUCT', () => {
    const state = reducer(undefined, backToProductStep());
    expect(state.step).toBe('PRODUCT');
  });

  it('resetCheckout returns a clean initial state', () => {
    const dirty = reducer(undefined, selectProduct({ productId: 'p1', quantity: 3 }));
    const state = reducer(dirty, resetCheckout());
    expect(state.selectedProductId).toBeNull();
    expect(state.quantity).toBe(1);
    expect(state.step).toBe('PRODUCT');
  });
});

describe('submitCheckoutInfo thunk', () => {
  beforeEach(() => jest.clearAllMocks());

  it('tokenizes the card, fetches the acceptance token and creates customer/delivery/transaction', async () => {
    (tokenizeCard as jest.Mock).mockResolvedValue({ token: 'tok_1', brand: 'visa', lastFour: '4242' });
    (fetchAcceptanceToken as jest.Mock).mockResolvedValue({ acceptanceToken: 'acc_1', permalink: 'x' });
    (backendApi.createCustomer as jest.Mock).mockResolvedValue({ id: 'c1', ...customerForm });
    (backendApi.createDelivery as jest.Mock).mockResolvedValue({ id: 'd1', ...deliveryForm });
    (backendApi.createTransaction as jest.Mock).mockResolvedValue({
      id: 't1',
      status: 'PENDING',
      amountInCents: 100000,
    });

    const store = buildStore();
    await store.dispatch(
      submitCheckoutInfo({
        productId: 'p1',
        quantity: 1,
        customer: customerForm,
        delivery: deliveryForm,
        card: cardForm,
      }),
    );

    const state = store.getState().checkout;
    expect(state.step).toBe('SUMMARY');
    expect(state.customerId).toBe('c1');
    expect(state.deliveryId).toBe('d1');
    expect(state.transaction?.id).toBe('t1');
    expect(state.cardToken).toBe('tok_1');
    expect(state.acceptanceToken).toBe('acc_1');
    expect(state.isProcessing).toBe(false);
    expect(backendApi.createDelivery).toHaveBeenCalledWith({ ...deliveryForm, customerId: 'c1' });
  });

  it('sets an error and stays out of SUMMARY when a step fails', async () => {
    (tokenizeCard as jest.Mock).mockRejectedValue(new Error('invalid card'));
    (fetchAcceptanceToken as jest.Mock).mockResolvedValue({ acceptanceToken: 'acc_1', permalink: 'x' });

    const store = buildStore();
    await store.dispatch(
      submitCheckoutInfo({
        productId: 'p1',
        quantity: 1,
        customer: customerForm,
        delivery: deliveryForm,
        card: cardForm,
      }),
    );

    const state = store.getState().checkout;
    expect(state.step).toBe('PRODUCT');
    expect(state.isProcessing).toBe(false);
    expect(state.error).toBeTruthy();
  });
});

describe('payCurrentTransaction thunk', () => {
  beforeEach(() => jest.clearAllMocks());

  function stateWithTransaction() {
    let state = reducer(undefined, selectProduct({ productId: 'p1', quantity: 1 }));
    state = {
      ...state,
      transaction: { id: 't1', status: 'PENDING' } as any,
      cardToken: 'tok_1',
      acceptanceToken: 'acc_1',
    };
    return state;
  }

  it('pays the transaction and moves to FINAL_STATUS', async () => {
    (backendApi.payTransaction as jest.Mock).mockResolvedValue({ id: 't1', status: 'APPROVED' });

    const store = configureStore({
      reducer: { checkout: reducer },
      preloadedState: { checkout: stateWithTransaction() },
    });

    await store.dispatch(payCurrentTransaction());

    const state = store.getState().checkout;
    expect(state.step).toBe('FINAL_STATUS');
    expect(state.transaction?.status).toBe('APPROVED');
  });

  it('fails fast when there is no pending transaction/token in state', async () => {
    const store = buildStore();
    await store.dispatch(payCurrentTransaction());

    const state = store.getState().checkout;
    expect(state.step).toBe('PRODUCT');
    expect(state.error).toBeTruthy();
    expect(backendApi.payTransaction).not.toHaveBeenCalled();
  });

  it('sets an error when the payment call rejects', async () => {
    (backendApi.payTransaction as jest.Mock).mockRejectedValue(new Error('gateway down'));

    const store = configureStore({
      reducer: { checkout: reducer },
      preloadedState: { checkout: stateWithTransaction() },
    });

    await store.dispatch(payCurrentTransaction());

    const state = store.getState().checkout;
    expect(state.step).not.toBe('FINAL_STATUS');
    expect(state.error).toBeTruthy();
  });
});
