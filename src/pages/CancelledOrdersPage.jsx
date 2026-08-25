import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiX, FiRefreshCw, FiRotateCcw } from 'react-icons/fi';
import useOrderList from '../hooks/useOrderList';
import { restoreCancelledOrder } from '../api/orders.api';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import DateRangeFilter from '../components/common/DateRangeFilter';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

// This is the "cancelled by admin" table: orders a staff member cancelled
// manually (as opposed to Pre-Cancelled, which holds system-flagged orders).
const CancelledOrdersPage = () => {
  const list = useOrderList('cancelled');
  const [busyId, setBusyId] = useState(null);

  // Acts on the specific line item clicked (its Mongo _id), not every
  // document sharing the same order_id.
  const handleRestore = async (order) => {
    setBusyId(order._id);
    try {
      const res = await restoreCancelledOrder(order._id);
      toast.success(res.message);
      list.refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore order.');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'styleNumber', label: 'Style No.' },
    { key: 'size', label: 'Size' },
    { key: 'quantity', label: 'Qty' },
    { key: 'price', label: 'Price', render: (r) => `₹${r.price ?? 0}` },
    { key: 'cancelled_by', label: 'Cancelled By' },
    { key: 'cancel_note', label: 'Note' },
    {
      key: 'order_date',
      label: 'Order Date',
      render: (r) => new Date(r.order_date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiX className="mr-2 text-red-500" />
          Cancelled Orders
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
        <LoadingState label="Loading cancelled orders..." />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <OrderTable
            columns={columns}
            rows={list.records}
            emptyMessage="No cancelled orders found."
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

export default CancelledOrdersPage;
