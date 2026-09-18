import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiRefreshCw, FiClock, FiCheck, FiPhone, FiX } from 'react-icons/fi';
import useOrderList from '../hooks/useOrderList';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import DateRangeFilter from '../components/common/DateRangeFilter';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { markPaymentPendingToConfirmOrders, updateCustomerContacted } from '../api/orders.api';

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'primary',
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    primary: {
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    success: {
      icon: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    },
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
  };

  const styles = variantStyles[variant] || variantStyles.primary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <FiX size={18} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full bg-gray-50 ${styles.icon}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</h3>

          {/* Message */}
          <p className="text-sm text-gray-500 text-center mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${styles.button}`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentPendingOrders = () => {
  const list = useOrderList('payment-pending-orders');
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    onConfirm: null,
  });

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const openModal = (config) => {
    setModal({ ...config, isOpen: true });
  };

  // runAction: `fn` now receives the full `order` object
  const runAction = async (fn, order, successVerb) => {
    setBusyId(order._id);

    try {
      const res = await fn(order);
      toast.success(res?.message || `${order.order_id} ${successVerb}.`);
      await list.refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAsCustomerContacted = (order) => {
    openModal({
      title: 'Mark as Cancelled',
      message: `Are you sure you want to mark ${order.order_id} as customer cancel? This action cannot be undone.`,
      confirmText: 'Yes, Mark as Cancel',
      variant: 'danger',
      onConfirm: async () => {
        closeModal();
        await runAction(
          //  adapter: API needs only the id
          (o) => updateCustomerContacted(o._id),
          order,
          'marked as customer contacted'
        );
      },
    });
  };

  const handleMarkAsConfirmed = (order, status) => {
    openModal({
      title: 'Confirm Order',
      message: `Are you sure you want to confirm order ${order.order_id}? This will move the order to confirmed status.`,
      confirmText: 'Yes, Confirm Order',
      variant: 'primary',
      onConfirm: async () => {
        closeModal();
        await runAction(
          //  adapter: API needs the full order object
          (o) => markPaymentPendingToConfirmOrders(o, status),
          order,
          'confirmed successfully'
        );
      },
    });
  };

  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'contact_number', label: 'Customer Number' },
    { key: 'payment_status', label: 'Payment Status' },
    // { key: 'payment_method', label: 'Payment Method' },

    {
      key: 'order_date',
      label: 'Order Date',
      render: (r) => {
        if (!r.order_date) return <span className="text-gray-400 italic">N/A</span>;
        const date = new Date(r.order_date);
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">
              {date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-xs text-gray-400">
              {date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        );
      },
    },

    { key: 'price', label: 'Price', render: (r) => `₹${r.price ?? 0}` },

    // {
    //   key: 'createdAt',
    //   label: 'Created At',
    //   render: (r) => {
    //     if (!r.createdAt) return <span className="text-gray-400 italic">N/A</span>;
    //     const date = new Date(r.createdAt);
    //     return (
    //       <div className="flex flex-col">
    //         <span className="text-sm font-medium text-gray-800">
    //           {date.toLocaleDateString('en-IN', {
    //             day: '2-digit',
    //             month: 'short',
    //             year: 'numeric',
    //           })}
    //         </span>
    //         <span className="text-xs text-gray-400">
    //           {date.toLocaleTimeString('en-IN', {
    //             hour: '2-digit',
    //             minute: '2-digit',
    //             hour12: true,
    //           })}
    //         </span>
    //       </div>
    //     );
    //   },
    // },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="p-2 bg-red-50 rounded-xl">
              <FiClock className="text-red-500" size={20} />
            </span>
            Payment Pending Orders
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-12">
            Manage orders awaiting payment confirmation
          </p>
        </div>
        <button
          onClick={list.refetch}
          disabled={list.loading}
          className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRefreshCw
            className={`transition-transform duration-500 ${
              list.loading ? 'animate-spin' : 'group-hover:rotate-180'
            }`}
            size={16}
          />
          <span className="text-sm font-medium text-gray-700">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar
            value={list.search}
            onChange={list.setSearch}
            placeholder="Search by Order ID..."
          />
          <DateRangeFilter
            startDate={list.startDate}
            endDate={list.endDate}
            onStartChange={list.setStartDate}
            onEndChange={list.setEndDate}
            onClear={list.clearDateFilters}
          />
        </div>
      </div>

      {/* Content */}
      {list.loading && list.records.length === 0 ? (
        <LoadingState label="Loading payment pending orders..." />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <OrderTable
            columns={columns}
            rows={list.records}
            emptyMessage="No payment pending orders found."
            renderRowActions={(order) => {
              const isBusy = busyId === order._id;
              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkAsCustomerContacted(order)}
                    disabled={isBusy}
                    className="group inline-flex items-center cursor-pointer gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isBusy ? (
                      <svg
                        className="animate-spin h-3.5 w-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <FiPhone size={13} className="transition-transform group-hover:scale-110" />
                    )}
                    Cancel
                  </button>

                  <button
                    onClick={() => handleMarkAsConfirmed(order, 'Prepaid Confirmed')}
                    disabled={isBusy}
                    className="group inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isBusy ? (
                      <svg
                        className="animate-spin h-3.5 w-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <FiCheck size={13} className="transition-transform group-hover:scale-110" />
                    )}
                    (Prepaid) Confirm
                  </button>

                  <button
                    onClick={() => handleMarkAsConfirmed(order, 'COD Confirmed')}
                    disabled={isBusy}
                    className="group inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg hover:from-yellow-700 hover:to-yellow-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:ring-offset-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isBusy ? (
                      <svg
                        className="animate-spin h-3.5 w-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <FiCheck size={13} className="transition-transform group-hover:scale-110" />
                    )}
                    (COD) Confirm
                  </button>
                </div>
              );
            }}
          />
          <Pagination
            page={list.pagination.page}
            totalPages={list.pagination.totalPages}
            totalRecords={list.pagination.totalRecords}
            onPageChange={list.setPage}
            loading={list.loading}
          />
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        variant={modal.variant}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
};

export default PaymentPendingOrders;
