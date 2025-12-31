// Root-level Payments API proxy replicating frontend implementation
import { api } from '@/lib/apiClient';

export interface PaymentStatus {
	isPaid: boolean;
	lastPayment?: {
		status: string;
		amount: number;
		reference: string;
	} | null;
}

export const getPaymentStatus = async (): Promise<PaymentStatus> => {
	return api.get('/payments/status');
};

export const initializePayment = async (amount: number, callbackUrl?: string): Promise<{ authorizationUrl: string; reference: string; accessCode?: string; }> => {
	return api.post('/payments/initialize', { amount, callbackUrl });
};

export const verifyPayment = async (reference: string) => {
	return api.get(`/payments/verify/${reference}`);
};

