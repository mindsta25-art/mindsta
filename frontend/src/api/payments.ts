/**
 * Payments API - Paystack integration
 */
import { api } from '@/lib/apiClient';

export interface PaymentStatus {
  isPaid: boolean;
  lastPayment?: {
    status: string;
    amount: number;
    reference: string;
  } | null;
}

export interface CartItemForPayment {
  subject: string;
  grade: string;
  term?: string;
  price: number;
}

export const getPaymentStatus = async (): Promise<PaymentStatus> => {
  return api.get('/payments/status');
};

export const initializePayment = async (
  amount: number, 
  items: CartItemForPayment[], 
  callbackUrl?: string
): Promise<{ authorizationUrl: string; reference: string; accessCode?: string; }> => {
  return api.post('/payments/initialize', { amount, items, callbackUrl });
};

export const verifyPayment = async (reference: string) => {
  return api.get(`/payments/verify/${reference}`);
};
