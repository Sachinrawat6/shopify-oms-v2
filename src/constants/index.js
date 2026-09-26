export const BASE_URL = 'http://localhost:5000/api/v1';
// export const BASE_URL = 'https://shopify-oms-v2-backend.onrender.com/api/v1';

// High-value COD threshold used by the upload classifier: a COD order above
// this amount is held as "pending" (High Value COD reason) instead of being
// auto-confirmed.
export const HIGH_VALUE_COD_THRESHOLD = 5000;

export const PENDING_REASONS = {
  BAD_ADDRESS: 'Bad Address',
  HIGH_RTO: 'High RTO Risk',
  MEDIUM_RTO: 'Medium RTO Risk',
  HIGH_VALUE_COD: 'High Value COD',
};

// Single source of truth for the sidebar + router, in the order requested.
export const NAV_ITEMS = [
  // processing category
  { path: '/upload', label: 'Upload Order', icon: 'upload', category: 'processing' },
  { path: '/confirmed', label: 'Confirmed Orders', icon: 'check-circle', category: 'processing' },
  { path: '/processed', label: 'Processed Orders', icon: 'success', category: 'processing' },
  { path: '/hold', label: 'Hold Orders', icon: 'pause-circle', category: 'processing' },

  // customer service category
  { path: '/pending', label: 'Pending Orders', icon: 'clock', category: 'customer-service' },
  { path: '/voided', label: 'Voided Orders', icon: 'slash', category: 'customer-service' },
  { path: '/cancelled', label: 'Cancelled Orders', icon: 'x', category: 'customer-service' },
  {
    path: '/blacklisted-customers',
    label: 'Blacklisted',
    icon: 'user-x',
    category: 'customer-service',
  },

  {
    path: '/blacklisted-orders',
    label: 'Blacklisted Orders',
    icon: 'shield-off',
    category: 'customer-service',
  },
  { path: '/refund-failed', label: 'Refund Failed', icon: 'x', category: 'customer-service' },
  {
    path: '/refund-orders',
    label: 'Refunded Orders',
    icon: 'check-circle',
    category: 'customer-service',
  },
  {
    path: '/payment-pending-orders',
    label: 'Payment Pending Orders',
    icon: 'clock',
    category: 'customer-service',
  },

  // miscellaneous
  { path: '/sales', label: 'Sales', icon: 'success', category: 'miscellaneous' },
  { path: '/dashboard', label: 'Dashboard', icon: 'grid', category: 'miscellaneous' },
  {
    path: '/pre-cancelled',
    label: 'Pre-Cancelled Orders',
    icon: 'x-circle',
    category: 'miscellaneous',
  },
];
