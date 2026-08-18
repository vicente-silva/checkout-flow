import { httpClient } from './httpClient';
import { backendApi } from './backendApi';

jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn(), post: jest.fn() },
}));

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('backendApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listProducts GETs /products', async () => {
    mockedHttpClient.get.mockResolvedValue({ data: [{ id: '1' }] });
    const result = await backendApi.listProducts();
    expect(mockedHttpClient.get).toHaveBeenCalledWith('/products');
    expect(result).toEqual([{ id: '1' }]);
  });

  it('getProduct GETs /products/:id', async () => {
    mockedHttpClient.get.mockResolvedValue({ data: { id: '1' } });
    const result = await backendApi.getProduct('1');
    expect(mockedHttpClient.get).toHaveBeenCalledWith('/products/1');
    expect(result).toEqual({ id: '1' });
  });

  it('createCustomer POSTs /customers', async () => {
    const input = {
      fullName: 'Jane',
      email: 'jane@example.com',
      phoneNumber: '+573000000000',
      documentType: 'CC',
      documentNumber: '123',
    };
    mockedHttpClient.post.mockResolvedValue({ data: { id: 'c1', ...input } });

    const result = await backendApi.createCustomer(input);
    expect(mockedHttpClient.post).toHaveBeenCalledWith('/customers', input);
    expect(result.id).toBe('c1');
  });

  it('createDelivery POSTs /deliveries', async () => {
    const input = {
      customerId: 'c1',
      addressLine: 'Cra 7',
      city: 'Bogota',
      region: 'Cundinamarca',
      postalCode: '110231',
    };
    mockedHttpClient.post.mockResolvedValue({ data: { id: 'd1', ...input } });

    const result = await backendApi.createDelivery(input);
    expect(mockedHttpClient.post).toHaveBeenCalledWith('/deliveries', input);
    expect(result.id).toBe('d1');
  });

  it('createTransaction POSTs /transactions', async () => {
    const input = { productId: 'p1', customerId: 'c1', deliveryId: 'd1', quantity: 1 };
    mockedHttpClient.post.mockResolvedValue({ data: { id: 't1', ...input } });

    const result = await backendApi.createTransaction(input);
    expect(mockedHttpClient.post).toHaveBeenCalledWith('/transactions', input);
    expect(result.id).toBe('t1');
  });

  it('payTransaction POSTs /transactions/:id/pay', async () => {
    const input = { cardToken: 'tok', acceptanceToken: 'acc', installments: 1 };
    mockedHttpClient.post.mockResolvedValue({ data: { id: 't1', status: 'APPROVED' } });

    const result = await backendApi.payTransaction('t1', input);
    expect(mockedHttpClient.post).toHaveBeenCalledWith('/transactions/t1/pay', input);
    expect(result.status).toBe('APPROVED');
  });

  it('getTransaction GETs /transactions/:id', async () => {
    mockedHttpClient.get.mockResolvedValue({ data: { id: 't1', status: 'PENDING' } });
    const result = await backendApi.getTransaction('t1');
    expect(mockedHttpClient.get).toHaveBeenCalledWith('/transactions/t1');
    expect(result.status).toBe('PENDING');
  });
});
