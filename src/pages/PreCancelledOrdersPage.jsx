import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiXCircle, FiRefreshCw, FiCheck, FiRotateCcw } from 'react-icons/fi';
import useOrderList from '../hooks/useOrderList';
import { finalizePreCancelledOrder, restorePreCancelledOrder } from '../api/orders.api';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import DateRangeFilter from '../components/common/DateRangeFilter';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const PreCancelledOrdersPage = () => {
  const list = useOrderList('pre-cancelled');
  const [busyId, setBusyId] = useState(null);

  // Acts on the specific line item clicked (its Mongo _id), not every
  // document sharing the same order_id.
  const runAction = async (fn, order, successVerb) => {
    setBusyId(order._id);
    try {
      const res = await fn(order._id);
      toast.success(res.message || `${order.order_id} ${successVerb}.`);
      list.refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
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
    { key: 'cancel_reason', label: 'Reason' },
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
          <FiXCircle className="mr-2 text-red-500" />
          Pre-Cancelled Orders
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
            emptyMessage="No pre-cancelled orders found."
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

export default PreCancelledOrdersPage;
