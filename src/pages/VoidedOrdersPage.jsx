// import { FiSlash, FiRefreshCw, FiAlertCircle, FiXCircle, FiX, FiCheckCircle } from 'react-icons/fi';
// import { useState } from 'react';
// import useOrderList from '../hooks/useOrderList';
// import OrderTable from '../components/orders/OrderTable';
// import Pagination from '../components/common/Pagination';
// import SearchBar from '../components/common/SearchBar';
// import DateRangeFilter from '../components/common/DateRangeFilter';
// import LoadingState from '../components/common/LoadingState';
// import ErrorState from '../components/common/ErrorState';
// import BlockOrderModal from '../components/orders/BlockOrderModal';
// import { blockCustomer } from '../api/orders.api';

// // New table (didn't exist before): Shopify orders with Financial Status =
// // "voided". Previously these were only counted on the upload screen and
// // discarded -- now persisted so nothing is lost.
// const VoidedOrdersPage = () => {
//   const list = useOrderList('voided');

//   // State for modal
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [blocking, setBlocking] = useState(false);
//   const [toast, setToast] = useState(null);

//   const columns = [
//     { key: 'order_id', label: 'Order ID' },
//     { key: 'styleNumber', label: 'Style No.' },
//     { key: 'size', label: 'Size' },
//     { key: 'quantity', label: 'Qty' },
//     { key: 'price', label: 'Price', render: (r) => `₹${r.price ?? 0}` },
//     { key: 'void_reason', label: 'Reason' },
//     {
//       key: 'order_date',
//       label: 'Order Date',
//       render: (r) => new Date(r.order_date).toLocaleDateString(),
//     },
//   ];

//   // Handle block button click
//   const handleBlockClick = (order) => {
//     setSelectedOrder(order);
//     setIsModalOpen(true);
//   };

//   // Handle confirm block
//   const handleConfirmBlock = async () => {
//     if (!selectedOrder) return;

//     setBlocking(true);
//     try {
//       const result = await blockCustomer(selectedOrder.order_id);

//       // Show success toast
//       setToast({
//         message: result.message || `Order ${selectedOrder.order_id} blocked successfully!`,
//         type: 'success',
//       });

//       // Close modal
//       setIsModalOpen(false);
//       setSelectedOrder(null);

//       // Refresh the list
//       await list.refetch();

//       // Auto hide toast after 5 seconds
//       setTimeout(() => setToast(null), 5000);
//     } catch (error) {
//       // Show error toast
//       setToast({
//         message: error.response?.data?.message || error.message || 'Failed to block order',
//         type: 'error',
//       });

//       // Auto hide toast after 5 seconds
//       setTimeout(() => setToast(null), 5000);
//     } finally {
//       setBlocking(false);
//     }
//   };

//   // Handle modal close
//   const handleModalClose = () => {
//     if (!blocking) {
//       setIsModalOpen(false);
//       setSelectedOrder(null);
//     }
//   };

//   return (
//     <div>
//       {/* Toast Notification */}
//       {toast && (
//         <div
//           className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
//             toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
//           } border rounded-lg shadow-lg p-4 animate-slide-in`}
//         >
//           <div className="flex items-start">
//             <div className="flex-shrink-0">
//               {toast.type === 'success' ? (
//                 <FiCheckCircle className="text-green-500" size={20} />
//               ) : (
//                 <FiXCircle className="text-red-500" size={20} />
//               )}
//             </div>
//             <div className="ml-3 flex-1">
//               <p className="text-sm text-gray-800">{toast.message}</p>
//             </div>
//             <button
//               onClick={() => setToast(null)}
//               className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600"
//             >
//               <FiX size={18} />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Block Order Modal */}
//       <BlockOrderModal
//         isOpen={isModalOpen}
//         onClose={handleModalClose}
//         onConfirm={handleConfirmBlock}
//         order={selectedOrder}
//         loading={blocking}
//       />

//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold text-gray-800 flex items-center">
//           <FiSlash className="mr-2 text-gray-500" />
//           Voided Orders
//         </h2>
//         <button
//           onClick={list.refetch}
//           disabled={list.loading}
//           className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
//         >
//           <FiRefreshCw className={`mr-2 ${list.loading ? 'animate-spin' : ''}`} />
//           Refresh
//         </button>
//       </div>

//       <div className="flex flex-col md:flex-row gap-4 mb-6">
//         <SearchBar
//           value={list.search}
//           onChange={list.setSearch}
//           placeholder="Search by Order ID..."
//         />
//         <DateRangeFilter
//           startDate={list.startDate}
//           endDate={list.endDate}
//           onStartChange={list.setStartDate}
//           onEndChange={list.setEndDate}
//           onClear={list.clearDateFilters}
//         />
//       </div>

//       {list.loading && list.records.length === 0 ? (
//         <LoadingState label="Loading voided orders..." />
//       ) : list.error ? (
//         <ErrorState message={list.error} onRetry={list.refetch} />
//       ) : (
//         <>
//           <OrderTable
//             columns={columns}
//             rows={list.records}
//             emptyMessage="No voided orders found."
//             renderRowActions={(order) => (
//               <button
//                 onClick={() => handleBlockClick(order)}
//                 className="flex items-center gap-1 px-3 cursor-pointer py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
//               >
//                 <FiAlertCircle className="text-xs" />
//                 Block
//               </button>
//             )}
//           />
//           <Pagination
//             page={list.pagination.page}
//             totalPages={list.pagination.totalPages}
//             totalRecords={list.pagination.totalRecords}
//             onPageChange={list.setPage}
//             loading={list.loading}
//           />
//         </>
//       )}
//     </div>
//   );
// };

// export default VoidedOrdersPage;

import { FiSlash, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';
import { useState } from 'react';
import useOrderList from '../hooks/useOrderList';
import OrderTable from '../components/orders/OrderTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import DateRangeFilter from '../components/common/DateRangeFilter';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import BlockOrderModal from '../components/orders/BlockOrderModal';
import { blockCustomer } from '../api/orders.api';

const VoidedOrdersPage = () => {
  const list = useOrderList('voided');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [toast, setToast] = useState(null);

  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'styleNumber', label: 'Style No.' },
    { key: 'size', label: 'Size' },
    { key: 'quantity', label: 'Qty' },
    { key: 'price', label: 'Price', render: (r) => `₹${r.price ?? 0}` },
    { key: 'void_reason', label: 'Reason' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'customer_email', label: 'Email' },
    {
      key: 'order_date',
      label: 'Order Date',
      render: (r) => new Date(r.order_date).toLocaleDateString(),
    },
  ];

  const handleBlockClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleConfirmBlock = async () => {
    if (!selectedOrder) return;

    setBlocking(true);
    try {
      const result = await blockCustomer(selectedOrder.order_id);

      // ✅ Extract message from API response properly
      const successMessage =
        result?.data?.message ||
        result?.message ||
        `Order ${selectedOrder.order_id} blocked successfully!`;

      setToast({
        message: successMessage, // ✅ Now it's a string
        type: 'success',
      });

      setIsModalOpen(false);
      setSelectedOrder(null);
      await list.refetch();

      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      // ✅ Extract error message properly
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to block order';

      setToast({
        message: errorMessage, // ✅ Now it's a string
        type: 'error',
      });

      setTimeout(() => setToast(null), 5000);
    } finally {
      setBlocking(false);
    }
  };

  const handleModalClose = () => {
    if (!blocking) {
      setIsModalOpen(false);
      setSelectedOrder(null);
    }
  };

  return (
    <div>
      {/* Toast Notification - Fixed */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
            toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          } border rounded-lg shadow-lg p-4 animate-slide-in`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <FiCheckCircle className="text-green-500" size={20} />
              ) : (
                <FiXCircle className="text-red-500" size={20} />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-gray-800">
                {typeof toast.message === 'string' ? toast.message : 'Operation completed'}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      <BlockOrderModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleConfirmBlock}
        order={selectedOrder}
        loading={blocking}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiSlash className="mr-2 text-gray-500" />
          Voided Orders
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
        <LoadingState label="Loading voided orders..." />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <OrderTable
            columns={columns}
            rows={list.records}
            emptyMessage="No voided orders found."
            renderRowActions={(order) => (
              <button
                onClick={() => handleBlockClick(order)}
                className="flex items-center gap-1 px-3 cursor-pointer py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <FiAlertCircle className="text-xs" />
                Block
              </button>
            )}
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

export default VoidedOrdersPage;
