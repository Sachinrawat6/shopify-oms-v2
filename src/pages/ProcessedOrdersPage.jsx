import { FiCheckCircle, FiRefreshCw, FiUser, FiCalendar, FiClock, FiSearch } from 'react-icons/fi';
import { useState } from 'react';
import useOrderList from '../hooks/useOrderList';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import DateRangeFilter from '../components/common/DateRangeFilter';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const columns = [
  { key: 'order_id', label: 'Order ID' },
  { key: 'styleNumber', label: 'Style No.' },
  { key: 'size', label: 'Size' },
  { key: 'quantity', label: 'Qty' },
  { key: 'price', label: 'Price', render: (r) => `₹${r.price ?? 0}` },
  { key: 'payment_type', label: 'Payment', render: (r) => <StatusBadge label={r.payment_type} /> },
  { key: 'contact_number', label: 'Contact' },
  {
    key: 'createdAt',
    label: 'Created At',
    render: (r) => formatDateTime(r.createdAt),
  },
  // {
  //   key: 'order_date',
  //   label: 'Order Date',
  //   render: (r) => formatDateTime(r.order_date),
  // },
];

const ProcessedOrdersPage = () => {
  const list = useOrderList('processed');
  console.log('processed orders ', list);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
            <FiCheckCircle className="text-blue-600 text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Processed Orders</h2>
            <p className="text-sm text-gray-500 mt-0.5">View all orders that have been processed</p>
          </div>
        </div>
        <button
          onClick={list.refetch}
          disabled={list.loading}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
        >
          <FiRefreshCw className={`text-gray-500 ${list.loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {!list.loading && list.records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Processed</p>
                <p className="text-2xl font-semibold text-gray-800">{list.records.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <FiCheckCircle className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Processed Today</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {
                    list.records.filter((order) => {
                      if (!order.processed_at) return false;
                      const today = new Date().toDateString();
                      return new Date(order.processed_at).toDateString() === today;
                    }).length
                  }
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                <FiClock className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Processed By</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {new Set(list.records.map((order) => order.processed_by || 'System')).size}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                <FiUser className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar
            value={list.search}
            onChange={list.setSearch}
            placeholder="Search by Order ID, style, contact..."
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

      {/* Orders Table */}
      {list.loading && list.records.length === 0 ? (
        <LoadingState label="Loading processed orders..." />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <OrderTable
              columns={columns}
              rows={list.records}
              emptyMessage="No processed orders found."
            />
          </div>
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

export default ProcessedOrdersPage;
