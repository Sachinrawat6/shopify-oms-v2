// DEPRECATED: this page and its two child components
// (ManualAddCancelOrder.jsx / ManualUpdateOrder.jsx) called hardcoded
// external URLs (picklist-backend.onrender.com) that are not part of this
// project's backend -- they were already broken/orphaned before this
// rewrite. Manual cancellation is now handled directly from the Cancelled
// Orders page (POST /api/v1/orders/cancelled). Kept as an empty stub (no
// delete access in this environment) -- safe to delete manually, and no
// longer imported from App.jsx.
const Action = () => null;
export default Action;
