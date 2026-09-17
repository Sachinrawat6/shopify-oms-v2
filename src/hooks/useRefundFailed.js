import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRefundFailedOrders } from '../api/orders.api';

const EMPTY = { data: { refund_failed_orders: [], total_refund_failed: 0 } };

const useRefundFailed = (initialDays = 30) => {
  const [refundFailedOrders, setRefundFailedOrders] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderDays, setOrderDays] = useState(initialDays);

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchRefundFailedOrders(orderDays);

      // Only accept the latest request's response
      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) return;

      // Normalize the shape so consumers always see { data: { refund_failed_orders: [...] } }
      const normalized =
        data?.data?.refund_failed_orders !== undefined
          ? data
          : {
              data: {
                refund_failed_orders:
                  data?.refund_failed_orders || data?.fileredRefundFailedOrders || [],
                total_refund_failed: data?.total_refund_failed ?? 0,
              },
            };

      setRefundFailedOrders(normalized);
    } catch (err) {
      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) return;

      const status = err?.response?.status;

      // 👇 404 = "no orders", not a fatal error
      if (status === 404) {
        setRefundFailedOrders(EMPTY);
        setError(null);
        return;
      }

      console.error('Failed to fetch refund failed orders', err?.message);
      setError(
        err?.response?.data?.message || err?.message || 'Failed to fetch Refund Failed Orders'
      );
      setRefundFailedOrders(EMPTY);
    } finally {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [orderDays]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    refundFailedOrders,
    loading,
    error,
    orderDays,
    setOrderDays,
    refetch: load, // 👈 exposed so the component can refetch after mutations
  };
};

export default useRefundFailed;
