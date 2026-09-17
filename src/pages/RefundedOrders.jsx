import { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiRefreshCw, FiInbox } from 'react-icons/fi';
import { BASE_URL } from '../constants/index.js';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  const first = parts[0]?.charAt(0)?.toUpperCase() || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0)?.toUpperCase() : '';
  return `${first}${last}` || '?';
};

const RefundedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Fetch refunded orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy: 'order_id',
        sortOrder: 'desc',
      });
      if (search) params.set('search', search);

      const res = await fetch(`${BASE_URL}/refund-orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch refunded orders');

      const json = await res.json();

      // Supports both ApiResponse shape and plain shape
      const payload = json?.data ?? json;
      const list = Array.isArray(payload) ? payload : payload?.data || [];
      const pag = payload?.pagination || {};

      setOrders(list);
      setPagination({
        total: pag.total ?? list.length,
        page: pag.page ?? page,
        limit: pag.limit ?? limit,
        totalPages: pag.totalPages ?? 1,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Trigger search only on Enter or button click
  const handleSearchSubmit = () => {
    const trimmed = searchInput.trim();
    if (trimmed === search) return; // no change
    setSearch(trimmed);
    setPage(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    if (search !== '') {
      setSearch('');
      setPage(1);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
  };

  // Visible page numbers (windowed pagination)
  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages;
    const current = pagination.page;
    const delta = 2;
    const range = [];

    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);

    range.push(1);
    if (start > 2) range.push('...');
    for (let i = start; i <= end; i++) range.push(i);
    if (end < total - 1) range.push('...');
    if (total > 1) range.push(total);

    return range;
  }, [pagination.totalPages, pagination.page]);

  const startIdx = (pagination.page - 1) * pagination.limit + 1;
  const endIdx = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="p-8 w-full mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Refunded Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Successfully processed refund orders</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by order, name, phone, email..."
              className="pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSearchSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <FiSearch className="text-sm" />
            Search
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <FiRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar: rows per page */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {loading ? (
            'Loading...'
          ) : pagination.total > 0 ? (
            <>
              Showing <span className="font-semibold text-gray-700">{startIdx}</span>–
              <span className="font-semibold text-gray-700">{endIdx}</span> of{' '}
              <span className="font-semibold text-gray-700">{pagination.total}</span>{' '}
              {pagination.total === 1 ? 'order' : 'orders'}
              {search && (
                <>
                  {' '}
                  for <span className="font-semibold text-gray-700">"{search}"</span>
                </>
              )}
            </>
          ) : (
            'No orders'
          )}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="rowsPerPage" className="text-sm text-gray-600 whitespace-nowrap">
            Rows per page
          </label>
          <select
            id="rowsPerPage"
            value={limit}
            onChange={handleLimitChange}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                Payment Methods
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Refund Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Refunded On
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <p className="text-sm text-gray-500">Loading refunded orders...</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                  >
                    <FiRefreshCw className="text-xs" />
                    Try again
                  </button>
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order, idx) => {
                const rowNumber = (pagination.page - 1) * pagination.limit + idx + 1;
                const paymentMethods = order.payment_methods || [];

                return (
                  <tr
                    key={order._id || order.order_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">{rowNumber}</td>

                    <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                      {order.order_id}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-indigo-700">
                            {getInitials(order.customer_name)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {order.customer_name || 'Guest'}
                          </p>
                          {order.customer_email ? (
                            <p className="text-xs text-gray-500 truncate">{order.customer_email}</p>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No email</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {order.customer_mobile ? (
                        <a
                          href={`tel:${order.customer_mobile}`}
                          className="text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          {order.customer_mobile}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Payment Methods */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {paymentMethods.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {paymentMethods.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Refund Status */}
                    <td className="px-4 py-3">
                      {order.refund_status ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Refunded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Refunded On (Date + Time) */}
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <FiInbox className="mx-auto text-3xl text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No refunded orders found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {search
                      ? `No results for "${search}". Try a different search or clear it.`
                      : 'Refunded orders will appear here once processed'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-700">{pagination.page}</span> of{' '}
            <span className="font-semibold text-gray-700">{pagination.totalPages}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <FiChevronLeft className="text-sm" />
            </button>

            {pageNumbers.map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400 select-none">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-md text-sm font-medium transition-colors ${
                    p === pagination.page
                      ? 'bg-indigo-600 text-white border border-indigo-600'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <FiChevronRight className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundedOrders;
