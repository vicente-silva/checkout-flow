import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { backendApi } from '@/api/backendApi';
import { fetchAcceptanceToken, tokenizeCard } from '@/api/wompiClient';
import { extractErrorMessage } from '@/api/httpClient';
import type { Transaction } from '@/api/types';
import type { CardBrand } from '@/domain/cardValidation';

export type CheckoutStep = 'PRODUCT' | 'PAYMENT_INFO' | 'SUMMARY' | 'FINAL_STATUS';

export interface CustomerFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  documentType: string;
  documentNumber: string;
}

export interface DeliveryFormData {
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
}

export interface CardDisplayInfo {
  brand: CardBrand | string;
  lastFour: string;
}

export interface CheckoutState {
  step: CheckoutStep;
  selectedProductId: string | null;
  quantity: number;
  customer: CustomerFormData | null;
  customerId: string | null;
  delivery: DeliveryFormData | null;
  deliveryId: string | null;
  cardDisplay: CardDisplayInfo | null;
  cardToken: string | null;
  acceptanceToken: string | null;
  transaction: Transaction | null;
  isProcessing: boolean;
  error: string | null;
}

const initialState: CheckoutState = {
  step: 'PRODUCT',
  selectedProductId: null,
  quantity: 1,
  customer: null,
  customerId: null,
  delivery: null,
  deliveryId: null,
  cardDisplay: null,
  cardToken: null,
  acceptanceToken: null,
  transaction: null,
  isProcessing: false,
  error: null,
};

export interface SubmitCheckoutInfoInput {
  productId: string;
  quantity: number;
  customer: CustomerFormData;
  delivery: DeliveryFormData;
  card: {
    number: string;
    cvc: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
  };
}

/**
 * Runs the whole "Payment info" step as one flow: tokenize the card
 * directly with Wompi (PAN never touches our backend), fetch the merchant
 * acceptance token, then persist customer/delivery/transaction(PENDING)
 * in our API. If any step fails, state is left ready to be retried.
 */
export const submitCheckoutInfo = createAsyncThunk(
  'checkout/submitInfo',
  async (input: SubmitCheckoutInfoInput, { rejectWithValue }) => {
    try {
      const [cardTokenInfo, acceptance] = await Promise.all([
        tokenizeCard(input.card),
        fetchAcceptanceToken(),
      ]);

      const customer = await backendApi.createCustomer(input.customer);
      const delivery = await backendApi.createDelivery({
        ...input.delivery,
        customerId: customer.id,
      });
      const transaction = await backendApi.createTransaction({
        productId: input.productId,
        customerId: customer.id,
        deliveryId: delivery.id,
        quantity: input.quantity,
      });

      return {
        customer,
        delivery,
        transaction,
        cardToken: cardTokenInfo.token,
        cardDisplay: { brand: cardTokenInfo.brand, lastFour: cardTokenInfo.lastFour },
        acceptanceToken: acceptance.acceptanceToken,
        customerForm: input.customer,
        deliveryForm: input.delivery,
      };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Could not start the checkout'));
    }
  },
);

export const payCurrentTransaction = createAsyncThunk(
  'checkout/pay',
  async (_: void, { getState, rejectWithValue }) => {
    const state = getState() as { checkout: CheckoutState };
    const { transaction, cardToken, acceptanceToken } = state.checkout;

    if (!transaction || !cardToken || !acceptanceToken) {
      return rejectWithValue('Missing payment information, please start over');
    }

    try {
      return await backendApi.payTransaction(transaction.id, {
        cardToken,
        acceptanceToken,
        installments: 1,
      });
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Payment could not be processed'));
    }
  },
);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    selectProduct(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      state.selectedProductId = action.payload.productId;
      state.quantity = action.payload.quantity;
    },
    openPaymentInfoStep(state) {
      state.step = 'PAYMENT_INFO';
      state.error = null;
    },
    backToProductStep(state) {
      state.step = 'PRODUCT';
    },
    resetCheckout() {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitCheckoutInfo.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(submitCheckoutInfo.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.customerId = action.payload.customer.id;
        state.deliveryId = action.payload.delivery.id;
        state.customer = action.payload.customerForm;
        state.delivery = action.payload.deliveryForm;
        state.transaction = action.payload.transaction;
        state.cardToken = action.payload.cardToken;
        state.cardDisplay = action.payload.cardDisplay;
        state.acceptanceToken = action.payload.acceptanceToken;
        state.step = 'SUMMARY';
      })
      .addCase(submitCheckoutInfo.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = (action.payload as string) ?? 'Could not start the checkout';
      })
      .addCase(payCurrentTransaction.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(payCurrentTransaction.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.transaction = action.payload;
        state.step = 'FINAL_STATUS';
      })
      .addCase(payCurrentTransaction.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = (action.payload as string) ?? 'Payment could not be processed';
      });
  },
});

export const { selectProduct, openPaymentInfoStep, backToProductStep, resetCheckout } =
  checkoutSlice.actions;
export default checkoutSlice.reducer;
