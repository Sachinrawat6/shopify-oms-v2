import { FiPackage, FiCheckCircle, FiClock, FiXCircle, FiCreditCard, FiTruck, FiAlertTriangle } from 'react-icons/fi';

const CARD_CONFIG = [
  { key: 'totalOrders', label: 'Total Orders', icon: FiPackage, color: 'bg-indigo-500' },
  { key: 'confirmed', label: 'Confirmed', icon: FiCheckCircle, color: 'bg-green-500' },
  { key: 'pending', label: 'Pending', icon: FiClock, color: 'bg-yellow-500' },
  { key: 'preCancelled', label: 'Pre-Cancelled', icon: FiXCircle, color: 'bg-orange-500' },
  { key: 'cancelledByAdmin', label: 'Cancelled by Admin', icon: FiXCircle, color: 'bg-red-500' },
  { key: 'finalPending', label: 'Final Pending (all reasons)', icon: FiAlertTriangle, color: 'bg-rose-500' },
  { key: 'cod', label: 'COD Orders', icon: FiTruck, color: 'bg-blue-500' },
  { key: 'prepaid', label: 'Pre-Paid Orders', icon: FiCreditCard, color: 'bg-emerald-500' },
];

const SummaryCards = ({ summary }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {CARD_CONFIG.map(({ key, label, icon: Icon, color }) => (
      <div key={key} className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 flex items-center">
          <div className={`flex-shrink-0 ${color} rounded-md p-3`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="ml-4">
            <dt className="text-xs font-medium text-gray-500 truncate">{label}</dt>
            <dd className="text-xl font-semibold text-gray-900">{summary[key] ?? 0}</dd>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default SummaryCards;
