import { useState, useEffect, useMemo, useCallback } from 'react';
import useRefundFailed from '../hooks/useRefundFailed';
import axios from 'axios';
import { BASE_URL } from '../constants/index.js';
import { FiAlertTriangle } from 'react-icons/fi';

const financialStatusStyles = {
  PAID: 'bg-green-50 text-green-700 border-green-200',
  PARTIALLY_REFUNDED: 'bg-orange-50 text-orange-700 border-orange-200',
  REFUNDED: 'bg-gray-50 text-gray-700 border-gray-200',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  VOIDED: 'bg-gray-50 text-gray-500 border-gray-200',
  EXPIRED: 'bg-gray-50 text-gray-500 border-gray-200',
};

const refundStatusStyles = {
  SUCCESS: 'bg-green-50 text-green-700 border-green-200',
  ERROR: 'bg-red-50 text-red-700 border-red-200',
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  FAILURE: 'bg-red-50 text-red-700 border-red-200',
};

const PRESET_OPTIONS = [
  { label: 'Today', value: 1 },
  { label: 'Last 3 Days', value: 3 },
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 15 Days', value: 15 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 2 Months', value: 60 },
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const formatAmount = (amount) => {
  const value = Number(amount);
  return Number.isFinite(value) ? currencyFormatter.format(value) : '—';
};

const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || '?';
};

const extractErrorMessage = (err) => {
  const data = err?.response?.data;
  if (data) {
    if (typeof data === 'string') return data;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      return typeof first === 'string' ? first : first?.message || 'Validation failed';
    }
  }
  if (err?.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (!err?.response && err?.request) return 'Network error. Please check your connection.';
  return err?.message || 'Something went wrong. Please try again.';
};

const ConfirmRefundModal = ({ open, orders, onCancel, onConfirm, isSubmitting, errorMessage }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onCancel();
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, isSubmitting, onCancel]);

  if (!open) return null;

  const isBulk = orders.length > 1;
  const firstOrder = orders[0];
  const orderLabel = isBulk
    ? `${orders.length} orders`
    : firstOrder?.name || firstOrder?.order_id || '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={() => !isSubmitting && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg border border-gray-200 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-6 border-b border-gray-100">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <FiAlertTriangle className="text-amber-600 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900">Confirm Mark as Refunded</h2>
            <p className="text-sm text-gray-500 mt-1">
              {isBulk
                ? `You are about to mark ${orders.length} orders as refunded.`
                : `You are about to mark ${orderLabel} as refunded.`}
            </p>
          </div>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <FiAlertTriangle className="text-red-600 text-sm flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {isBulk ? (
            <div className="border border-gray-200 rounded-md max-h-52 overflow-y-auto">
              <ul className="divide-y divide-gray-100">
                {orders.map((o, i) => (
                  <li
                    key={o.id ?? o.name ?? i}
                    className="px-3 py-2 flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-gray-800">{o.name || o.order_id}</span>
                    <span className="text-xs text-gray-500">
                      {[o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ') ||
                        '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="text-gray-500">Order:</span>{' '}
                <span className="font-medium text-gray-800">
                  {firstOrder?.name || firstOrder?.order_id}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Customer:</span>{' '}
                {[firstOrder?.customer?.firstName, firstOrder?.customer?.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Guest'}
              </p>
            </div>
          )}

          {!errorMessage && (
            <p className="text-xs text-gray-500 mt-4">
              This action will record these orders as refunded. You can review them on the Refunded
              Orders page.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {errorMessage ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Processing...' : errorMessage ? 'Retry' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RefundFailed = () => {
  const { refundFailedOrders, loading, error, orderDays, setOrderDays } = useRefundFailed(7);

  // 👇 Local overlay of orders that were refunded during this session.
  //    They're filtered out from the display, but the hook's underlying data stays intact.
  const [locallyRefundedIds, setLocallyRefundedIds] = useState(new Set());

  const [selectedOption, setSelectedOption] = useState('custom');
  const [customDays, setCustomDays] = useState(7);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingMode, setPendingMode] = useState(null);
  const [modalError, setModalError] = useState(null);

  // Base list from hook
  const rawRefundOrders = refundFailedOrders?.data?.refund_failed_orders || [];

  // 👇 Apply local filter so refunded orders disappear immediately
  const refundOrders = useMemo(() => {
    if (locallyRefundedIds.size === 0) return rawRefundOrders;
    return rawRefundOrders.filter((o) => {
      const key = o.id ?? o.name;
      return !locallyRefundedIds.has(key);
    });
  }, [rawRefundOrders, locallyRefundedIds]);

  // Sync dropdown with incoming orderDays value
  useEffect(() => {
    const matchedPreset = PRESET_OPTIONS.find((opt) => opt.value === orderDays);
    if (matchedPreset) {
      setSelectedOption(String(matchedPreset.value));
      setCustomDays(matchedPreset.value);
    } else {
      setSelectedOption('custom');
      setCustomDays(orderDays);
    }
  }, [orderDays]);

  // Clear selection when order list changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [refundFailedOrders]);

  // Clear locally-refunded overlay when a fresh fetch comes in
  // (because the backend list already excludes them now)
  useEffect(() => {
    if (locallyRefundedIds.size > 0) {
      setLocallyRefundedIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refundFailedOrders]);

  // Derived values
  const { totalRefundAmount, totalOrders, refundErrorCount } = useMemo(() => {
    let amount = 0;
    let errorCount = 0;

    for (const order of refundOrders) {
      for (const txn of order.transactions || []) {
        if (txn.kind === 'REFUND' && txn.status === 'ERROR') {
          amount += Number(txn.amountSet?.shopMoney?.amount) || 0;
          errorCount += 1;
        }
      }
    }

    return {
      totalRefundAmount: amount,
      totalOrders: refundOrders.length,
      refundErrorCount: errorCount,
    };
  }, [refundOrders]);

  // Selection helpers
  const allSelected = refundOrders.length > 0 && selectedIds.size === refundOrders.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < refundOrders.length;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(refundOrders.map((o) => o.id ?? o.name)));
    }
  }, [allSelected, refundOrders]);

  const toggleSelectOne = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectChange = (e) => {
    const value = e.target.value;
    setSelectedOption(value);
    if (value !== 'custom') {
      const days = Number(value);
      setCustomDays(days);
      setOrderDays(days);
    }
  };

  const handleCustomDaysChange = (e) => {
    setCustomDays(e.target.value);
  };

  const handleApplyCustomDays = () => {
    const days = Number(customDays);
    if (Number.isFinite(days) && days > 0) {
      setOrderDays(days);
    }
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') handleApplyCustomDays();
  };

  // ----- API call -----
  const markOrdersAsRefunded = async (orders) => {
    const payload = orders.map((o) => ({
      order_id: o.name,
      customer_name: `${o.customer?.firstName || ''} ${o.customer?.lastName || ''}`.trim(),
      customer_mobile: `${o.customer?.phone || o.shippingAddress?.phone || ''}`,
      customer_email: `${o.customer?.email || ''}`,
      payment_methods: o.paymentGatewayNames || [],
      refund_status: true,
    }));

    const response = await axios.post(`${BASE_URL}/refund-orders`, {
      orders: payload,
    });
    return response.data;
  };

  // ----- User confirmation triggers -----
  const requestSingleRefund = (order) => {
    setPendingOrders([order]);
    setPendingMode('single');
    setModalError(null);
    setConfirmOpen(true);
  };

  const requestBulkRefund = () => {
    if (selectedIds.size === 0) return;
    const selectedOrders = refundOrders.filter((o) => selectedIds.has(o.id ?? o.name));
    setPendingOrders(selectedOrders);
    setPendingMode('bulk');
    setModalError(null);
    setConfirmOpen(true);
  };

  const closeConfirmModal = () => {
    if (isSubmitting) return;
    setConfirmOpen(false);
    setPendingOrders([]);
    setPendingMode(null);
    setModalError(null);
  };

  // ----- Actual submit (runs on modal Confirm) -----
  const handleConfirmRefund = async () => {
    if (pendingOrders.length === 0) return;

    setModalError(null);

    try {
      if (pendingMode === 'single') {
        const key = pendingOrders[0].id ?? pendingOrders[0].name;
        setSubmittingOrderId(key);
      } else {
        setIsSubmitting(true);
      }

      await markOrdersAsRefunded(pendingOrders);

      // 👇 Optimistic local update — hide refunded orders immediately
      setLocallyRefundedIds((prev) => {
        const next = new Set(prev);
        for (const o of pendingOrders) {
          next.add(o.id ?? o.name);
        }
        return next;
      });

      // Clear selection & close modal — no refetch needed
      setSelectedIds(new Set());
      setConfirmOpen(false);
      setPendingOrders([]);
      setPendingMode(null);
      setModalError(null);
    } catch (err) {
      console.error('Mark as refunded failed:', err);
      setModalError(extractErrorMessage(err));
    } finally {
      setSubmittingOrderId(null);
      setIsSubmitting(false);
    }
  };

  if (loading && rawRefundOrders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-base">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-600 text-base">
          Something went wrong while fetching refund failed orders.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 w-full mx-auto">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
            Refund Failed Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and review orders with failed refund transactions
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label
            htmlFor="orderDays"
            className="text-sm font-medium text-gray-600 whitespace-nowrap"
          >
            Period
          </label>
          <select
            id="orderDays"
            value={selectedOption}
            onChange={handleSelectChange}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[150px]"
          >
            {PRESET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>

          {selectedOption === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={customDays}
                onChange={handleCustomDaysChange}
                onKeyDown={handleCustomKeyDown}
                placeholder="Days"
                className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">days</span>
              <button
                type="button"
                onClick={handleApplyCustomDays}
                disabled={!customDays || Number(customDays) <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Period</p>
          <p className="text-lg font-semibold text-gray-800 mt-1">
            Last {orderDays} {orderDays === 1 ? 'day' : 'days'}
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Orders</p>
          <p className="text-lg font-semibold text-gray-800 mt-1">{totalOrders}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Failed Refunds
          </p>
          <p className="text-lg font-semibold text-red-600 mt-1">{refundErrorCount}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Total Failed Amount
          </p>
          <p className="text-lg font-semibold text-red-600 mt-1">
            {formatAmount(totalRefundAmount)}
          </p>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 bg-indigo-50 border border-indigo-200 rounded-lg px-5 py-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-indigo-600 text-white text-xs font-semibold">
              {selectedIds.size}
            </span>
            <span className="text-sm font-medium text-indigo-900">
              {selectedIds.size === 1 ? 'order selected' : 'orders selected'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={requestBulkRefund}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Mark {selectedIds.size} as Refunded
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  disabled={refundOrders.length === 0}
                  aria-label="Select all orders"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Refund Transactions
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {refundOrders.length > 0 ? (
              refundOrders.map((order, idx) => {
                const orderKey = order.id ?? order.name;
                const isSelected = selectedIds.has(orderKey);
                const isRowSubmitting = submittingOrderId === orderKey;

                const refundTxns =
                  order.transactions?.filter((t) => t.kind?.toLowerCase() === 'refund') || [];

                const customer = order.customer || {};
                const fullName =
                  [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Guest';
                const phone = customer.phone || order.shippingAddress?.phone || null;
                const email = customer.email || null;

                return (
                  <tr
                    key={orderKey}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(orderKey)}
                        aria-label={`Select order ${order.name}`}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{order.name}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-700">
                            {getInitials(customer.firstName, customer.lastName)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{fullName}</p>
                          {email ? (
                            <p className="text-xs text-gray-500 truncate">{email}</p>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No email</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${
                          financialStatusStyles[order.displayFinancialStatus] ||
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {order.displayFinancialStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {refundTxns.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {refundTxns.map((txn, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span
                                className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${
                                  refundStatusStyles[txn.status] ||
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                {txn.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatAmount(txn.amountSet?.shopMoney?.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => requestSingleRefund(order)}
                        disabled={isRowSubmitting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        {isRowSubmitting ? 'Submitting...' : 'Mark As Refund'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <p className="text-sm text-gray-500 font-medium">No refund failed orders found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try adjusting the date range or check back later
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmRefundModal
        open={confirmOpen}
        orders={pendingOrders}
        isSubmitting={isSubmitting || submittingOrderId !== null}
        onCancel={closeConfirmModal}
        onConfirm={handleConfirmRefund}
        errorMessage={modalError}
      />
    </div>
  );
};

export default RefundFailed;
