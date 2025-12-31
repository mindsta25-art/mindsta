import React, { useState } from 'react';
import { getPaymentStatus, initializePayment } from '@/api/payments';

interface PaywallProps {
  amount?: number; // default subscription amount
  onSuccess?: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ amount = 5000, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  const checkStatus = async () => {
    try {
      const s = await getPaymentStatus();
      setStatus(s);
      if (s.isPaid && onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const startPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const callbackUrl = window.location.origin + '/payment/callback';
      const init = await initializePayment(amount, callbackUrl);
      // Redirect to Paystack hosted payment page
      window.location.href = init.authorizationUrl;
    } catch (e: any) {
      setError(e.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="p-6 border rounded-md bg-white shadow-sm max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-2">Premium Content Locked</h2>
      <p className="text-sm text-gray-600 mb-4">You need to complete payment to access lessons and exams.</p>
      {status?.lastPayment && (
        <div className="text-xs mb-3 text-gray-500">Last payment status: {status.lastPayment.status}</div>
      )}
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      <button
        onClick={startPayment}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Redirecting…' : `Pay ₦${amount.toLocaleString()} Now`}
      </button>
      <button
        onClick={checkStatus}
        className="ml-2 px-3 py-2 text-sm border rounded hover:bg-gray-50"
      >
        Refresh Status
      </button>
    </div>
  );
};

export default Paywall;
