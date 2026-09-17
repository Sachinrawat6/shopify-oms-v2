import { useEffect, useState, useCallback } from 'react';
import { fetchPaymentPendingOrExpiredOrders } from '../api/orders.api';

export const useExpiredPaymentOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expiredPaymentOrders, setExpiredPaymentOrders] = useState([]);

  const fetchExpiredPayment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchPaymentPendingOrExpiredOrders();

      const orders = response?.data || [];
      setExpiredPaymentOrders(orders);
    } catch (err) {
      const message = err?.message || 'Failed to fetch expired payment orders';
      setError(message);
      console.error(`Failed to fetch Expired Orders: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpiredPayment();
  }, [fetchExpiredPayment]);

  return { loading, error, expiredPaymentOrders, refetch: fetchExpiredPayment };
};
