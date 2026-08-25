import { useEffect, useState, useCallback, useRef } from 'react';
import { FiSearch, FiRefreshCw, FiLoader, FiUserX, FiPlus, FiX, FiSave } from 'react-icons/fi';
import { fetchBlacklistedCustomers, createBlacklistedCustomers } from '../api/customers.api';
import Pagination from '../components/common/Pagination';

const emptyRow = () => ({ customer_id: '', first_name: '', last_name: '', email: '' });

const BlacklistedCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBlacklistedCustomers({ page, limit, search });
      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.totalRecords || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch blacklisted customers.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchChange = (value) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 400);
  };

  const updateRow = (index, field, value) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  const resetForm = () => {
    setRows([emptyRow()]);
    setShowForm(false);
  };

  const handleSave = async () => {
    setError('');
    setMessage('');
    const validRows = rows
      .filter((row) => row.customer_id && row.first_name)
      .map((row) => ({
        customer_id: Number(row.customer_id),
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        email: row.email.trim(),
      }));

    if (validRows.length === 0) {
      setError('Customer ID and First Name are required for at least one row.');
      return;
    }

    setSaving(true);
    try {
      const res = await createBlacklistedCustomers(validRows);
      setMessage(res.message || `${validRows.length} customer(s) added to blacklist.`);
      resetForm();
      setPage(1);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customers to blacklist.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'NA';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'NA';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg border border-red-200">
            <FiUserX className="text-red-600 text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Blacklisted Customers</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage customers restricted from placing orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
          >
            <FiRefreshCw className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <FiPlus className="text-lg" />
            Add to Blacklist
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 mb-4 rounded-lg bg-red-50 border-l-4 border-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {message && (
        <div className="p-4 mb-4 rounded-lg bg-green-50 border-l-4 border-green-500">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Add Customer(s) to Blacklist
            </h2>
            <span className="text-xs text-gray-400">{rows.length} row(s)</span>
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-200"
              >
                <input
                  type="number"
                  placeholder="Customer Phone *"
                  value={row.customer_id}
                  onChange={(e) => updateRow(index, 'customer_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                />
                <input
                  type="text"
                  placeholder="First Name *"
                  value={row.first_name}
                  onChange={(e) => updateRow(index, 'first_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={row.last_name}
                  onChange={(e) => updateRow(index, 'last_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={row.email}
                  onChange={(e) => updateRow(index, 'email', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                />
                <button
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                  className="w-full sm:w-auto px-3 py-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors duration-200 flex items-center justify-center"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={addRow}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              <FiPlus className="text-lg" />
              Add Another Row
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={resetForm}
                className="flex-1 sm:flex-none px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
              >
                {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, or customer ID..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Customer Phone', 'First Name', 'Last Name', 'Email', 'Added On'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    <FiLoader className="animate-spin inline mr-2 text-red-600" />
                    Loading blacklisted customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FiUserX className="text-3xl text-gray-300" />
                      <span>No blacklisted customers found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer, index) => (
                  <tr
                    key={customer._id || index}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{customer.customer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {customer.first_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.last_name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.email || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={setPage}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default BlacklistedCustomersPage;
