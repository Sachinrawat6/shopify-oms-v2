import { FiShieldOff, FiRefreshCw } from 'react-icons/fi';
import useOrderList from '../hooks/useOrderList';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import DateRangeFilter from '../components/common/DateRangeFilter';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

// New table (didn't exist before): whenever an order belongs to a
// blacklisted customer, the backend redirects it here regardless of which
// table it was originally headed for (see backend/services/blacklist.service.js).
const BlacklistedOrdersPage = () => {
  const list = useOrderList('blacklisted');

  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'customer_email', label: 'Email' },
    { key: 'styleNumber', label: 'Style No.' },
    { key: 'size', label: 'Size' },
    { key: 'quantity', label: 'Qty' },
    { key: 'price', label: 'Price', render: (r) => `₹${r.price ?? 0}` },
    { key: 'original_destination', label: 'Would-be Table' },
    { key: 'blacklist_reason', label: 'Reason' },
    { key: 'order_date', label: 'Order Date', render: (r) => new Date(r.order_date).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiShieldOff className="mr-2 text-gray-700" />
          Blacklisted Orders
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
        <SearchBar value={list.search} onChange={list.setSearch} placeholder="Search order id, email..." />
        <DateRangeFilter
          startDate={list.startDate}
          endDate={list.endDate}
          onStartChange={list.setStartDate}
          onEndChange={list.setEndDate}
          onClear={list.clearDateFilters}
        />
      </div>

      {list.loading && list.records.length === 0 ? (
        <LoadingState label="Loading blacklisted orders..." />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <OrderTable columns={columns} rows={list.records} emptyMessage="No blacklisted orders found." />
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

export default BlacklistedOrdersPage;
