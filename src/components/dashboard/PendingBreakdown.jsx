import { FiMapPin, FiAlertTriangle, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';

// "Final Pending" breakdown -- how many pending orders fall into each of the
// 4 hold reasons for this date range. An order can count in more than one
// bucket if it was flagged for multiple reasons at once.
const REASON_CONFIG = [
  { key: 'Bad Address', label: 'Bad Address', icon: FiMapPin, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { key: 'High RTO Risk', label: 'High RTO Risk', icon: FiAlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { key: 'Medium RTO Risk', label: 'Medium RTO Risk', icon: FiAlertCircle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: 'High Value COD', label: '> ₹4000 (COD)', icon: FiTrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

const PendingBreakdown = ({ breakdown = {}, finalPending = 0 }) => (
  <div className="bg-white p-4 shadow rounded-lg mb-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">Final Pending Breakdown</h2>
      <span className="text-sm text-gray-500">
        Total: <span className="font-semibold text-gray-800">{finalPending}</span>
      </span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {REASON_CONFIG.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className={`p-4 rounded-lg border flex flex-col items-center ${color}`}>
          <div className="flex items-center gap-1">
            <Icon />
            <span className="font-medium text-sm">{label}</span>
          </div>
          <p className="text-2xl font-bold mt-2">{breakdown[key] ?? 0}</p>
        </div>
      ))}
    </div>
  </div>
);

export default PendingBreakdown;
