import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPauseCircle, FiRefreshCw, FiTruck, FiLoader, FiCalendar, FiX } from 'react-icons/fi';
import useOrderList from '../hooks/useOrderList';
import { moveHoldOrdersToProcessed } from '../api/orders.api';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const HoldOrdersPage = () => {
  const list = useOrderList('hold');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [movingBulk, setMovingBulk] = useState(false);
  const [movingId, setMovingId] = useState(null);

  // Local filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
      render: (r) =>
        new Date(r.order_date).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
    },
  ];

  // Filter records based on date and time range
  const getFilteredRecords = () => {
    if (!list.records || list.records.length === 0) return [];

    return list.records.filter((order) => {
      const orderDate = new Date(order.order_date);

      if (!startDate && !endDate && !startTime && !endTime) {
        return true;
      }

      let filterStart = null;
      let filterEnd = null;

      if (startDate) {
        const [year, month, day] = startDate.split('-').map(Number);
        const hours = startTime ? parseInt(startTime.split(':')[0]) : 0;
        const minutes = startTime ? parseInt(startTime.split(':')[1]) : 0;
        filterStart = new Date(year, month - 1, day, hours, minutes, 0);
      }

      if (endDate) {
        const [year, month, day] = endDate.split('-').map(Number);
        const hours = endTime ? parseInt(endTime.split(':')[0]) : 23;
        const minutes = endTime ? parseInt(endTime.split(':')[1]) : 59;
        filterEnd = new Date(year, month - 1, day, hours, minutes, 59);
      }

      if (filterStart && filterEnd) {
        return orderDate >= filterStart && orderDate <= filterEnd;
      } else if (filterStart) {
        return orderDate >= filterStart;
      } else if (filterEnd) {
        return orderDate <= filterEnd;
      }

      return true;
    });
  };

  // Move to proccessed function
  const moveToProcessed = async (ids) => {
    const userConfirmation = window.confirm('Are you sure want to mark as processed?');
    if (!userConfirmation) return;

    if (!ids || ids.length === 0) {
      toast.warning('No orders selected to move.');
      return;
    }

    try {
      const response = await moveHoldOrdersToProcessed(ids);

      // Handle different response formats
      const successMessage =
        response?.message ||
        response?.data?.message ||
        `${ids.length} order(s) moved to processed successfully!`;

      toast.success(successMessage);

      // Clear selections
      setSelectedIds(new Set());

      // Refresh the list
      await list.refetch();

      return response;
    } catch (error) {
      console.error('Move to processed error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to move orders';
      toast.error(errorMessage);
      throw error;
    }
  };

  const filteredRecords = getFilteredRecords();
  const allSelected =
    filteredRecords.length > 0 && filteredRecords.every((o) => selectedIds.has(o._id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredRecords.map((o) => o._id)));
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
  };

  const hasActiveFilters = startDate || endDate || startTime || endTime;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiPauseCircle className="mr-2 text-purple-600" />
          Hold Orders
          {filteredRecords.length !== list.records.length && list.records.length > 0 && (
            <span className="ml-3 text-sm font-normal text-gray-500">
              ({filteredRecords.length} of {list.records.length})
            </span>
          )}
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

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Start Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <FiCalendar className="inline mr-1" />
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Start Time */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">From Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              step="60"
            />
          </div>

          {/* End Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <FiCalendar className="inline mr-1" />
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* End Time */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">To Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              step="60"
            />
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiX className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
            <span className="text-xs text-gray-500">Active filters:</span>
            {startDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-md">
                From:{' '}
                {new Date(startDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {startTime && ` ${startTime}`}
              </span>
            )}
            {endDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-md">
                To:{' '}
                {new Date(endDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {endTime && ` ${endTime}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-4">
        <SearchBar
          value={list.search}
          onChange={list.setSearch}
          placeholder="Search order id, source..."
          className="flex-1"
        />
        <div className="flex items-center gap-3">
          {filteredRecords.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Select all ({filteredRecords.length})
            </label>
          )}
          <button
            onClick={async () => {
              setMovingBulk(true);
              try {
                await moveToProcessed(Array.from(selectedIds));
              } finally {
                setMovingBulk(false);
              }
            }}
            disabled={selectedIds.size === 0 || movingBulk}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {movingBulk ? <FiLoader className="animate-spin" /> : <FiTruck />}
            Move Selected ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* Content */}
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
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                ),
              },
              ...columns,
            ]}
            rows={filteredRecords}
            emptyMessage={
              hasActiveFilters
                ? 'No hold orders found with the selected filters.'
                : 'No hold orders found.'
            }
            renderRowActions={(order) => (
              <button
                onClick={async () => {
                  setMovingId(order._id);
                  try {
                    await moveToProcessed([order._id]);
                  } finally {
                    setMovingId(null);
                  }
                }}
                disabled={movingId === order._id}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {movingId === order._id ? <FiLoader className="animate-spin" /> : <FiTruck />}
                Move to Proccessed
              </button>
            )}
          />
          <Pagination
            page={list.pagination.page}
            totalPages={list.pagination.totalPages}
            totalRecords={filteredRecords.length}
            onPageChange={list.setPage}
            loading={list.loading}
          />
        </>
      )}
    </div>
  );
};

export default HoldOrdersPage;
