import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPauseCircle, FiRefreshCw, FiTruck, FiLoader } from 'react-icons/fi';
import useOrderList from '../hooks/useOrderList';
import { moveHoldOrdersToConfirmed } from '../api/orders.api';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

// Selection is tracked by each row's Mongo _id (not order_id) -- a
// multi-item order can have several hold documents sharing the same
// order_id, and moving one must not cascade to its siblings.
const HoldOrdersPage = () => {
  const list = useOrderList('hold');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [movingBulk, setMovingBulk] = useState(false);
  const [movingId, setMovingId] = useState(null);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const moveToConfirmed = async (ids) => {
    try {
      const res = await moveHoldOrdersToConfirmed(ids);
      toast.success(res.message);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      list.refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move orders.');
    }
  };

  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'styleNumber', label: 'Style No.' },
    { key: 'size', label: 'Size' },
    { key: 'quantity', label: 'Qty' },
    { key: 'price', label: 'Price', render: (r) => `₹${r.price ?? 0}` },
    { key: 'source', label: 'Source' },
    {
      key: 'order_date',
      label: 'Order Date',
      render: (r) => new Date(r.order_date).toLocaleDateString(),
    },
  ];

  const allSelected = list.records.length > 0 && list.records.every((o) => selectedIds.has(o._id));
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(list.records.map((o) => o._id)));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiPauseCircle className="mr-2 text-purple-600" />
          Hold Orders
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-4">
        <SearchBar
          value={list.search}
          onChange={list.setSearch}
          placeholder="Search order id, source..."
        />
        {/* <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4"
          />
          Select all on page
        </label>
        <button
          onClick={async () => {
            setMovingBulk(true);
            await moveToConfirmed(Array.from(selectedIds));
            setMovingBulk(false);
          }}
          disabled={selectedIds.size === 0 || movingBulk}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {movingBulk ? <FiLoader className="animate-spin" /> : <FiTruck />}
          Move Selected to Confirmed ({selectedIds.size})
        </button> */}
      </div>

      {list.loading && list.records.length === 0 ? (
        <LoadingState label="Loading hold orders..." />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <OrderTable
            columns={[
              {
                key: '__select',
                label: '',
                render: (r) => (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r._id)}
                    onChange={() => toggleSelect(r._id)}
                    className="h-4 w-4"
                  />
                ),
              },
              ...columns,
            ]}
            rows={list.records}
            emptyMessage="No hold orders found."
            // renderRowActions={(order) => (
            //   <button
            //     onClick={async () => {
            //       setMovingId(order._id);
            //       await moveToConfirmed([order._id]);
            //       setMovingId(null);
            //     }}
            //     disabled={movingId === order._id}
            //     className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            //   >
            //     {movingId === order._id ? <FiLoader className="animate-spin" /> : <FiTruck />}
            //     Move to Confirmed
            //   </button>
            // )}
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

export default HoldOrdersPage;
