import { httpClient } from './httpClient';
import type { Customer, Delivery, Product, Transaction } from './types';

export const backendApi = {
  listProducts: async (): Promise<Product[]> => {
    const { data } = await httpClient.get<Product[]>('/products');
    return data;
  },

  getProduct: async (productId: string): Promise<Product> => {
    const { data } = await httpClient.get<Product>(`/products/${productId}`);
    return data;
  },

  createCustomer: async (input: {
    fullName: string;
    email: string;
    phoneNumber: string;
    documentType: string;
    documentNumber: string;
  }): Promise<Customer> => {
    const { data } = await httpClient.post<Customer>('/customers', input);
    return data;
  },

  createDelivery: async (input: {
    customerId: string;
    addressLine: string;
    city: string;
    region: string;
    postalCode: string;
    country?: string;
  }): Promise<Delivery> => {
    const { data } = await httpClient.post<Delivery>('/deliveries', input);
    return data;
  },

  createTransaction: async (input: {
    productId: string;
    customerId: string;
    deliveryId: string;
    quantity: number;
  }): Promise<Transaction> => {
    const { data } = await httpClient.post<Transaction>('/transactions', input);
    return data;
  },

  payTransaction: async (
    transactionId: string,
    input: { cardToken: string; acceptanceToken: string; installments: number },
  ): Promise<Transaction> => {
    const { data } = await httpClient.post<Transaction>(`/transactions/${transactionId}/pay`, input);
    return data;
  },

  getTransaction: async (transactionId: string): Promise<Transaction> => {
    const { data } = await httpClient.get<Transaction>(`/transactions/${transactionId}`);
    return data;
  },
};
