import { useState } from 'react';
import { toast } from 'react-toastify';
import { editPendingOrder } from '../api/orders.api';

const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

// Inline "edit size" form for a single pending order row, wired to
// PATCH /api/v1/orders/pending/:id via the shared api client.
const EditPage = ({ order, onClose, refreshPendingOrders }) => {
  const [size, setSize] = useState(order.size || '');
  const [saving, setSaving] = useState(false);

  const handleUpdateSize = async (e) => {
    e.preventDefault();
    if (!size) {
      toast.warning('Please select a size.');
      return;
    }
    if (!window.confirm('Are you sure you want to edit this order?')) return;

    setSaving(true);
    try {
      const res = await editPendingOrder(order._id, size);
      toast.success(res.message || 'Size updated successfully.');
      onClose();
      refreshPendingOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update size.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex gap-2 items-center" onSubmit={handleUpdateSize}>
      <select
        onChange={(e) => setSize(e.target.value)}
        value={size}
        className="border border-gray-300 bg-white py-1.5 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
      >
        <option value="">Select Size</option>
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={saving}
        className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
      >
        Cancel
      </button>
    </form>
  );
};

export default EditPage;
