// export const BASE_URL = 'http://localhost:5000/api/v1';
export const BASE_URL = 'https://shopify-oms-v2-backend.onrender.com/api/v1';

// High-value COD threshold used by the upload classifier: a COD order above
// this amount is held as "pending" (High Value COD reason) instead of being
// auto-confirmed.
export const HIGH_VALUE_COD_THRESHOLD = 4000;

export const PENDING_REASONS = {
  BAD_ADDRESS: 'Bad Address',
  HIGH_RTO: 'High RTO Risk',
  MEDIUM_RTO: 'Medium RTO Risk',
  HIGH_VALUE_COD: 'High Value COD',
};

// Single source of truth for the sidebar + router, in the order requested.
export const NAV_ITEMS = [
  { path: '/upload', label: 'Upload Order', icon: 'upload' },
  { path: '/confirmed', label: 'Confirmed Orders', icon: 'check-circle' },
  { path: '/pending', label: 'Pending Orders', icon: 'clock' },
  { path: '/processed', label: 'Processed Orders', icon: 'success' },
  { path: '/hold', label: 'Hold Orders', icon: 'pause-circle' },
  { path: '/voided', label: 'Voided Orders', icon: 'slash' },
  { path: '/pre-cancelled', label: 'Pre-Cancelled Orders', icon: 'x-circle' },
  { path: '/cancelled', label: 'Cancelled Orders', icon: 'x' },
  { path: '/blacklisted-customers', label: 'Blacklisted', icon: 'user-x' },
  { path: '/blacklisted-orders', label: 'Blacklisted Orders', icon: 'shield-off' },
  { path: '/dashboard', label: 'Dashboard', icon: 'grid' },
];
