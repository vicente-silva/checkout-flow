import { configureStore } from '@reduxjs/toolkit';
import reducer, { fetchProducts } from './productsSlice';
import { backendApi } from '@/api/backendApi';

jest.mock('@/api/backendApi', () => ({
  backendApi: { listProducts: jest.fn() },
}));

function buildStore() {
  return configureStore({ reducer: { products: reducer } });
}

describe('productsSlice', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts in idle state', () => {
    const store = buildStore();
    expect(store.getState().products.status).toBe('idle');
    expect(store.getState().products.items).toEqual([]);
  });

  it('sets status to loading while fetching, then succeeded with items', async () => {
    (backendApi.listProducts as jest.Mock).mockResolvedValue([{ id: '1', name: 'Widget' }]);
    const store = buildStore();

    const promise = store.dispatch(fetchProducts());
    expect(store.getState().products.status).toBe('loading');

    await promise;

    expect(store.getState().products.status).toBe('succeeded');
    expect(store.getState().products.items).toEqual([{ id: '1', name: 'Widget' }]);
  });

  it('sets status to failed with an error message when the request rejects', async () => {
    (backendApi.listProducts as jest.Mock).mockRejectedValue(new Error('network down'));
    const store = buildStore();

    await store.dispatch(fetchProducts());

    expect(store.getState().products.status).toBe('failed');
    expect(store.getState().products.error).toBe('network down');
  });
});
