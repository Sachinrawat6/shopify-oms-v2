// components/orders/BlockOrderModal.jsx
import React, { useState } from 'react';
import { FiX, FiAlertTriangle, FiCheck, FiLoader } from 'react-icons/fi';

const BlockOrderModal = ({ isOpen, onClose, onConfirm, order, loading }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmationText !== 'BLOCK') {
      setError('Please type "BLOCK" to confirm');
      return;
    }
    setError('');
    onConfirm(order);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center text-red-600">
            <FiAlertTriangle className="text-xl mr-2" />
            <h3 className="text-lg font-semibold">Block & Cancel Order</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <p className="font-semibold">⚠️ Warning: This action cannot be undone!</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Customer will be permanently blocked</li>
              <li>Order will be moved to cancelled</li>
              <li>All items from voided list will be removed</li>
              {order && (
                <>
                  <li className="mt-2 font-medium text-gray-700">
                    Order ID: <span className="font-mono">{order.order_id}</span>
                  </li>
                  {order.customer_name && (
                    <li className="text-gray-700">
                      Customer: <span className="font-medium">{order.customer_name}</span>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-bold text-red-600">BLOCK</span> to confirm
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Type BLOCK to confirm"
              autoFocus
              disabled={loading}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || confirmationText !== 'BLOCK'}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <FiCheck className="mr-2" />
                Confirm Block
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockOrderModal;
