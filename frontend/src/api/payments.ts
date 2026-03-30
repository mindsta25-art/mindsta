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
  lessonId?: string; // set for lesson-level purchases
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

export interface SalesAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  toplessons: Array<{
    subject: string;
    grade: string;
    term: string;
    sales: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    reference: string;
    paidAt: string;
    user: {
      email: string;
      fullName: string;
    };
    itemCount: number;
  }>;
}

export const getSalesAnalytics = async (): Promise<SalesAnalytics> => {
  return api.get('/payments/admin/analytics');
};

export interface PurchaseRecord {
  id?: string;
  _id?: string;
  reference: string;
  amount: number;
  status: string;
  userId: {
    _id?: string;
    email: string;
    fullName: string;
  };
  items: Array<{
    subject: string;
    grade: string;
    term?: string;
    price: number;
  }>;
  paidAt?: string;
  createdAt: string;
}

export const getAllPurchases = async (): Promise<PurchaseRecord[]> => {
  return api.get('/payments/admin');
};

export const generatePurchasesReport = async (params: any) => {
  try {
    const purchases = await getAllPurchases();
    
    // Ensure we have an array
    if (!Array.isArray(purchases)) {
      throw new Error('Invalid purchases data received');
    }
    
    // Filter by period if specified
    let filteredPurchases = purchases;
    if (params.period && params.period !== 'all' && params.period !== 'month') {
      const now = new Date();
      const periodMap: Record<string, number> = {
        day: 1,
        week: 7,
        year: 365
      };
      const daysAgo = periodMap[params.period];
      if (daysAgo) {
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        filteredPurchases = purchases.filter(p => {
          const purchaseDate = new Date(p.createdAt);
          return purchaseDate >= startDate;
        });
      }
    }
    
    const successfulPurchases = filteredPurchases.filter(p => p.status === 'success');
    const totalRevenue = successfulPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    return {
      summary: {
        totalPurchases: filteredPurchases.length,
        successfulTransactions: successfulPurchases.length,
        failedTransactions: filteredPurchases.filter(p => p.status !== 'success').length,
        totalRevenue: `₦${totalRevenue.toLocaleString()}`,
        averageOrderValue: successfulPurchases.length > 0 
          ? `₦${(totalRevenue / successfulPurchases.length).toFixed(2)}` 
          : '₦0.00',
        period: params.period || 'all-time'
      },
      data: filteredPurchases.length > 0 ? filteredPurchases.map(p => ({
        reference: p.reference || 'N/A',
        customer: p.userId?.fullName || 'Unknown',
        email: p.userId?.email || 'N/A',
        amount: `₦${(p.amount || 0).toLocaleString()}`,
        items: p.items?.length || 0,
        status: p.status || 'unknown',
        date: p.paidAt || p.createdAt ? new Date(p.paidAt || p.createdAt).toLocaleDateString() : 'N/A',
        time: p.paidAt || p.createdAt ? new Date(p.paidAt || p.createdAt).toLocaleTimeString() : 'N/A'
      })) : [],
      purchases: filteredPurchases,
      totalRevenue,
      totalTransactions: successfulPurchases.length,
      period: params.period || 'all-time'
    };
  } catch (error: any) {
    console.error('Error generating purchases report:', error);
    throw new Error(error.message || 'Failed to generate purchases report');
  }
};
