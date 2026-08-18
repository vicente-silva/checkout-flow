import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import productsReducer from './slices/productsSlice';
import checkoutReducer from './slices/checkoutSlice';

const rootReducer = combineReducers({
  products: productsReducer,
  checkout: checkoutReducer,
});

// Only `checkout` is persisted: it's what lets a customer refresh mid-flow
// (payment info, transaction id, current step) and pick up where they left
// off, per the "resilient app" requirement. `products` is always re-fetched
// fresh so stock is never shown stale.
const persistConfig = {
  key: 'checkout-flow',
  storage,
  whitelist: ['checkout'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
