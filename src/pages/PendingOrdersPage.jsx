import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiClock, FiRefreshCw, FiCheck, FiX, FiEdit2 } from 'react-icons/fi';
import useOrderList from '../hooks/useOrderList';
import { confirmPendingOrder, cancelPendingOrder } from '../api/orders.api';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import DateRangeFilter from '../components/common/DateRangeFilter';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EditPage from '../components/EditPage';

const daysSince = (date) => {
  if (!date) return 0;
  const diffMs = Date.now() - new Date(date).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const PendingOrdersPage = () => {
  const list = useOrderList('pending');
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Acts on the specific line item clicked (its Mongo _id), not every
  // document sharing the same order_id -- a multi-item order must let each
  // line item be confirmed/cancelled independently.
  const handleConfirm = async (order) => {
    if (!window.confirm(`Confirm this line item of order ${order.order_id}?`)) return;
    setBusyId(order._id);
    try {
      const res = await confirmPendingOrder(order._id);
      toast.success(res.message);
      list.refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm order.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel this line item of order ${order.order_id}?`)) return;
    setBusyId(order._id);
    try {
      const res = await cancelPendingOrder(order._id);
      toast.success(res.message);
      list.refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setBusyId(null);
    }
  };

  // pending_reason is an array -- an order can be flagged for more than one
  // reason at once (e.g. both High RTO Risk and Bad Address).
  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'styleNumber', label: 'Style No.' },
    { key: 'size', label: 'Size' },
    { key: 'quantity', label: 'Qty' },
    { key: 'price', label: 'Price', render: (r) => `₹${r.price ?? 0}` },
    {
      key: 'pending_reason',
      label: 'Pending Reason(s)',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {(r.pending_reason || []).length > 0 ? (
            r.pending_reason.map((reason) => <StatusBadge key={reason} label={reason} />)
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      ),
    },
    // { key: 'shipping_method', label: 'Shipping' },
    { key: 'contact_number', label: 'Contact' },
    {
      key: 'order_date',
      label: 'Order Date',
      render: (r) => new Date(r.order_date).toLocaleDateString(),
    },
    {
      key: 'age',
      label: 'Age',
      render: (r) => {
        const days = daysSince(r.order_date);
        const overFour = days > 4;
        return (
          <span
            className={`py-1 px-2 rounded-md text-xs ${overFour ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
          >
            {overFour ? `Delay ${days - 4} day(s)` : `${4 - days} day(s) left`}
          </span>
        );
      },
    },
  ];

  const overFourDaysCount = list.records.filter((r) => daysSince(r.order_date) > 4).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiClock className="mr-2 text-yellow-500" />
          Pending Orders
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

      <div className="flex flex-col md:flex-row gap-4 mb-2">
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
      <p className="text-red-600 font-semibold mb-4">
        Pending Over 4 Days (this page): {overFourDaysCount}
      </p>

      {list.loading && list.records.length === 0 ? (
        <LoadingState label="Loading pending orders..." />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <OrderTable
            columns={columns}
            rows={list.records}
            emptyMessage="No pending orders found."
            renderRowActions={(order) =>
              editingId === order._id ? (
                <EditPage
                  order={order}
                  onClose={() => setEditingId(null)}
                  refreshPendingOrders={list.refetch}
                />
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirm(order)}
                    disabled={busyId === order._id}
                    className="text-green-600 hover:text-green-800 flex items-center px-3 py-1 border border-green-200 rounded hover:bg-green-50 disabled:opacity-50"
                  >
                    <FiCheck className="mr-1" /> Confirm
                  </button>
                  <button
                    onClick={() => handleCancel(order)}
                    disabled={busyId === order._id}
                    className="text-red-600 hover:text-red-800 flex items-center px-3 py-1 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    <FiX className="mr-1" /> Cancel
                  </button>
                  <button
                    onClick={() => setEditingId(order._id)}
                    disabled={busyId === order._id}
                    className="text-yellow-600 hover:text-yellow-800 flex items-center px-3 py-1 border border-yellow-200 rounded hover:bg-yellow-50 disabled:opacity-50"
                  >
                    <FiEdit2 className="mr-1" /> Edit
                  </button>
                </div>
              )
            }
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

export default PendingOrdersPage;
