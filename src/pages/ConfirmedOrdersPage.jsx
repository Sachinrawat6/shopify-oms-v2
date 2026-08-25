import {
  FiCheckCircle,
  FiRefreshCw,
  FiFileText,
  FiFile,
  FiDownload,
  FiPrinter,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import { useState, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useOrderList from '../hooks/useOrderList';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import DateRangeFilter from '../components/common/DateRangeFilter';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { markOrdersAsProcessed } from '../api/orders.api';
import { toast } from 'react-toastify';

const columns = [
  { key: 'order_id', label: 'Order ID' },
  { key: 'styleNumber', label: 'Style No.' },
  { key: 'size', label: 'Size' },
  { key: 'quantity', label: 'Qty' },
  { key: 'price', label: 'Price', render: (r) => `₹${r.price ?? 0}` },
  { key: 'payment_type', label: 'Payment', render: (r) => <StatusBadge label={r.payment_type} /> },
  { key: 'contact_number', label: 'Contact' },
  {
    key: 'order_date',
    label: 'Order Date',
    render: (r) => new Date(r.order_date).toLocaleDateString(),
  },
];

// Custom CSV download function
const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) {
    toast.warning('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header] || '';
      return typeof val === 'string' &&
        (val.includes(',') || val.includes('"') || val.includes('\n'))
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`${data.length} records exported successfully!`);
};

const ConfirmedOrdersPage = () => {
  const list = useOrderList('confirmed');
  const [exporting, setExporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [processing, setProcessing] = useState(false);

  // Filter orders based on criteria
  const filteredOrders = useMemo(() => {
    if (!list.records || list.records.length === 0) return { express: [], standard: [] };

    // Express: (Prepaid AND amount > 5000) OR Express shipping
    const express = list.records.filter((order) => {
      const isPrepaid = order.payment_type?.toLowerCase() === 'prepaid';
      const totalAmount = order.price * order.quantity;
      const isExpressShipping = order.shipping_method?.toLowerCase().includes('express');

      return (isPrepaid && totalAmount > 5000) || isExpressShipping;
    });

    // Standard: amount <= 5000 AND NOT Express shipping
    const standard = list.records.filter((order) => {
      const totalAmount = order.price * order.quantity;
      const isExpressShipping = order.shipping_method?.toLowerCase().includes('express');

      return totalAmount <= 5000 && !isExpressShipping;
    });

    return { express, standard };
  }, [list.records]);

  // Group orders by order_id for PDF
  const groupOrdersByOrderId = (orders) => {
    const grouped = {};
    orders.forEach((order) => {
      if (!grouped[order.order_id]) {
        grouped[order.order_id] = {
          ...order,
          items: [],
        };
      }
      grouped[order.order_id].items.push(order);
      grouped[order.order_id].totalAmount = grouped[order.order_id].items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    });
    return Object.values(grouped);
  };

  // Generate CSV data with format: Sku Id, Rack Space, Good
  const generateCSVData = (orders) => {
    if (!orders || orders.length === 0) return [];

    const sortedOrders = [...orders].sort((a, b) =>
      (a.styleNumber || '').toString().localeCompare((b.styleNumber || '').toString())
    );

    return sortedOrders.map((order) => ({
      'Sku Id': `${order.styleNumber || ''}-other-${order.size || ''}`,
      'Rack Space': 'Default',
      Good: '1',
    }));
  };

  // Generate PDF
  const generatePDF = (orders, type) => {
    if (!orders || orders.length === 0) {
      toast.warning(`No ${type} orders to export`);
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      let srNo = 1;

      // Add header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, 'bold');
      doc.text(`${type} Orders Report`, pageWidth / 2, 40, { align: 'center' });

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 60, { align: 'center' });

      // Group and sort orders by order_id
      const groupedOrders = groupOrdersByOrderId(orders);
      groupedOrders.sort((a, b) => a.order_id?.localeCompare(b.order_id || '') || 0);

      // Prepare table data
      const tableData = [];

      groupedOrders.forEach((group) => {
        // Add items directly without header rows
        group.items.forEach((item) => {
          const total = (item.price || 0) * (item.quantity || 0);
          tableData.push([
            srNo++,
            group.order_id || 'N/A',
            item.styleNumber || 'N/A',
            item.size || 'N/A',
            item.quantity || 0,
            `₹${total.toFixed(2)}`,
            group.contact_number || 'N/A',
            group.customer_name || 'N/A',
          ]);
        });

        // Add separator row between orders
        if (groupedOrders.indexOf(group) < groupedOrders.length - 1) {
          tableData.push([
            { content: '', colSpan: 8, styles: { fillColor: [255, 255, 255], minCellHeight: 5 } },
          ]);
        }
      });

      // Add table
      autoTable(doc, {
        startY: 80,
        head: [['Sr.', 'Order ID', 'Style No.', 'Size', 'Qty', 'Total', 'Phone', 'Customer']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [40, 40, 40],
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 65, halign: 'center' },
          2: { cellWidth: 55, halign: 'center' },
          3: { cellWidth: 40, halign: 'center' },
          4: { cellWidth: 30, halign: 'center' },
          5: { cellWidth: 55, halign: 'right' },
          6: { cellWidth: 65, halign: 'center' },
          7: { cellWidth: 80, halign: 'left' },
        },
        margin: { left: 30, right: 30 },
        tableWidth: pageWidth - 60,
        didDrawPage: (data) => {
          // Footer on each page
          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Page ${i} of ${pageCount} | ${type} Orders Report`,
              pageWidth / 2,
              doc.internal.pageSize.height - 20,
              { align: 'center' }
            );
          }
        },
      });

      doc.save(
        `${type.toLowerCase().replace(/\s+/g, '_')}_orders_${new Date().toISOString().split('T')[0]}.pdf`
      );
      toast.success(`${orders.length} ${type} orders exported successfully!`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Error generating PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportAllOrders = (type) => {
    const orders = type === 'Express' ? filteredOrders.express : filteredOrders.standard;
    generatePDF(orders, type);
  };

  // Handle row selection
  const handleRowSelect = useCallback((row) => {
    setSelectedRows((prev) => {
      const rowId = row._id || row.order_id;
      const exists = prev.some((r) => (r._id || r.order_id) === rowId);
      if (exists) {
        return prev.filter((r) => (r._id || r.order_id) !== rowId);
      } else {
        return [...prev, row];
      }
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((checked, rows) => {
    if (checked) {
      setSelectedRows(rows);
    } else {
      setSelectedRows([]);
    }
  }, []);

  // Handle mark as processed
  const handleMarkAsProcessed = async () => {
    if (selectedRows.length === 0) {
      toast.warning('Please select at least one order to mark as processed.');
      return;
    }

    if (
      !window.confirm(`Are you sure you want to mark ${selectedRows.length} order(s) as processed?`)
    ) {
      return;
    }

    setProcessing(true);
    try {
      const orderIds = selectedRows.map((row) => row.order_id || row._id);
      const response = await markOrdersAsProcessed(orderIds);

      toast.success(`Successfully processed ${response.data.movedCount} order(s).`);
      setSelectedRows([]);
      await list.refetch(); // Refresh the list
    } catch (error) {
      console.error('Error marking orders as processed:', error);
      toast.error(
        error.response?.data?.message || 'Failed to mark orders as processed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedRows([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg border border-green-200">
            <FiCheckCircle className="text-green-600 text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Confirmed Orders</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage and export confirmed orders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={list.refetch}
            disabled={list.loading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
          >
            <FiRefreshCw className={`text-gray-500 ${list.loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-700">
              {selectedRows.length} order(s) selected
            </span>
            <button
              onClick={handleClearSelection}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <FiX /> Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAsProcessed}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
            >
              {processing ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
              {processing ? 'Processing...' : 'Mark as Processed'}
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {!list.loading && list.records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
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
                <p className="text-sm text-gray-500">Express Shipping</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {filteredOrders.express.length}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                <FiFileText className="text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Standard Shipping</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {filteredOrders.standard.length}
                </p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                <FiFile className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      {!list.loading && list.records.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAllOrders('Express')}
              disabled={exporting || filteredOrders.express.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50"
            >
              <FiPrinter />
              Export Express PDF
            </button>
            <button
              onClick={() => {
                const data = generateCSVData(filteredOrders.express);
                downloadCSV(data, `express_orders_${new Date().toISOString().split('T')[0]}.csv`);
              }}
              disabled={filteredOrders.express.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-700 rounded-lg hover:bg-purple-800 transition-colors duration-200 disabled:opacity-50"
            >
              <FiDownload />
              Export Express CSV
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAllOrders('Standard')}
              disabled={exporting || filteredOrders.standard.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50"
            >
              <FiPrinter />
              Export Standard PDF
            </button>
            <button
              onClick={() => {
                const data = generateCSVData(filteredOrders.standard);
                downloadCSV(data, `standard_orders_${new Date().toISOString().split('T')[0]}.csv`);
              }}
              disabled={filteredOrders.standard.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-700 rounded-lg hover:bg-orange-800 transition-colors duration-200 disabled:opacity-50"
            >
              <FiDownload />
              Export Standard CSV
            </button>
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
        <LoadingState label="Loading confirmed orders..." />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <OrderTable
            columns={columns}
            rows={list.records}
            emptyMessage="No confirmed orders found."
            selectable={true}
            selectedRows={selectedRows}
            onRowSelect={handleRowSelect}
            onSelectAll={handleSelectAll}
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

export default ConfirmedOrdersPage;
