import { PropsWithChildren } from 'react';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import productsReducer, { ProductsState } from '@/store/slices/productsSlice';
import checkoutReducer, { CheckoutState } from '@/store/slices/checkoutSlice';

const rootReducer = combineReducers({
  products: productsReducer,
  checkout: checkoutReducer,
});

export type TestRootState = ReturnType<typeof rootReducer>;

export function renderWithStore(
  ui: React.ReactElement,
  preloadedState?: { products?: Partial<ProductsState>; checkout?: Partial<CheckoutState> },
) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as TestRootState,
  });

  function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper }) };
}
