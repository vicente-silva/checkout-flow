export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  imageUrl: string;
  sku: string;
  stockQuantity: number;
  inStock: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  documentType: string;
  documentNumber: string;
}

export interface Delivery {
  id: string;
  customerId: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  deliveryFeeInCents: number;
}

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';

export interface Transaction {
  id: string;
  reference: string;
  productId: string;
  customerId: string;
  deliveryId: string;
  quantity: number;
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  amountInCents: number;
  status: TransactionStatus;
  gatewayTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}
