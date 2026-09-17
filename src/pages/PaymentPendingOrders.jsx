import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiRefreshCw, FiClock, FiCheck } from 'react-icons/fi';
import useOrderList from '../hooks/useOrderList';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import DateRangeFilter from '../components/common/DateRangeFilter';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { updateCustomerContacted } from '../api/orders.api';

const PaymentPendingOrders = () => {
  const list = useOrderList('payment-pending-orders');
  const [busyId, setBusyId] = useState(null);

  const handleMarkAsCustomerContacted = async (id) => {
    return await updateCustomerContacted(id);
  };

  const runAction = async (fn, order, successVerb) => {
    setBusyId(order._id);

    try {
      const res = await fn(order._id);

      toast.success(res.message || `${order.order_id} ${successVerb}.`);

      await list.refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'contact_number', label: 'Customer Number' },
    { key: 'payment_status', label: 'Payment Status' },
    { key: 'payment_method', label: 'Payment Method' },

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

    {
      key: 'createdAt',
      label: 'Created At',
      render: (r) => {
        if (!r.createdAt) return <span className="text-gray-400 italic">N/A</span>;
        const date = new Date(r.createdAt);
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
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiClock className="mr-2 text-red-500" />
          Payment Pending Orders
        </h2>
        <button
          onClick={list.refetch}
          disabled={list.loading}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-2 ${list.loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
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

      {list.loading && list.records.length === 0 ? (
        <LoadingState label="Loading pre-cancelled orders..." />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <OrderTable
            columns={columns}
            rows={list.records}
            emptyMessage="No payment pending orders found."
            renderRowActions={(order) => (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    runAction(
                      handleMarkAsCustomerContacted,
                      order,
                      `${order.order_id} mark as customer contacted`
                    )
                  }
                  disabled={busyId === order._id}
                  className="text-green-600 hover:text-green-800 flex items-center px-4 py-3 border border-green-200 rounded-2xl hover:bg-green-50 cursor-pointer disabled:opacity-50"
                >
                  <FiCheck className="mr-1 border rounded-full" /> Mark as Contacted
                </button>
              </div>
            )}
          />
          <Pagination
            page={list.pagination.page}
            totalPages={list.pagination.totalPages}
            totalRecords={list.pagination.totalRecords}
            onPageChange={list.setPage}
            loading={list.loading}
          />
        </>
      )}
    </div>
  );
};

export default PaymentPendingOrders;
