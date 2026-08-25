import apiClient from './client';

// Generic paginated list fetcher shared by every order page.
// `resource` is one of: confirmed | pending | pre-cancelled | cancelled |
// hold | voided | blacklisted
export const fetchOrders = (
  resource,
  { page = 1, limit = 500, search = '', startDate, endDate } = {}
) =>
  apiClient
    .get(`/orders/${resource}`, {
      params: { page, limit, search, startDate, endDate },
    })
    .then((res) => res.data.data);

export const createOrder = (resource, payload) =>
  apiClient.post(`/orders/${resource}`, payload).then((res) => res.data);

export const createOrdersBulk = (resource, orders) =>
  apiClient.post(`/orders/${resource}/bulk`, { orders }).then((res) => res.data);

// Pending order actions. These take the specific row's Mongo `_id` (not
// order_id) -- an order can have several line items sharing the same
// order_id, and confirming/cancelling one must not cascade to its siblings.
export const confirmPendingOrder = (id) =>
  apiClient.post('/orders/pending/confirm', { id }).then((res) => res.data);

export const cancelPendingOrder = (id) =>
  apiClient.post('/orders/pending/cancel', { id }).then((res) => res.data);

export const editPendingOrder = (id, size) =>
  apiClient.patch(`/orders/pending/${id}`, { size }).then((res) => res.data);

// Pre-cancelled order actions (also by _id, same reasoning as above)
export const finalizePreCancelledOrder = (id) =>
  apiClient.post('/orders/pre-cancelled/finalize', { id }).then((res) => res.data);

export const restorePreCancelledOrder = (id) =>
  apiClient.post('/orders/pre-cancelled/restore', { id }).then((res) => res.data);

// Cancelled order actions (also by _id)
export const restoreCancelledOrder = (id) =>
  apiClient.post('/orders/cancelled/restore', { id }).then((res) => res.data);

// Hold order actions (also by _id)
export const moveHoldOrdersToConfirmed = (ids) =>
  apiClient.post('/orders/hold/move-to-confirmed', { ids }).then((res) => res.data);

export const markOrdersAsProcessed = async (orderIds) => {
  const response = await apiClient.post('/orders/processed/bulk', { orderIds });
  return response.data;
};

// Alternative: Direct bulk create in processed
export const bulkCreateProcessedOrders = async (resource, orders) => {
  const response = await apiClient.post(`/orders/${resource}/bulk`, { orders });
  return response.data;
};

export const blockCustomer = async (order_id) => {
  const response = await apiClient.post(`/orders/voided/block`, { order_id });
  return response.data;
};
