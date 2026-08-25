const VARIANTS = {
  COD: 'bg-blue-100 text-blue-800',
  Prepaid: 'bg-emerald-100 text-emerald-800',
  'Bad Address': 'bg-orange-100 text-orange-800',
  'High RTO Risk': 'bg-rose-100 text-rose-800',
  'Medium RTO Risk': 'bg-amber-100 text-amber-800',
  'High Value COD': 'bg-purple-100 text-purple-800',
  'Not Confirmed': 'bg-slate-100 text-slate-800',
  default: 'bg-gray-100 text-gray-800',
};

const StatusBadge = ({ label }) => {
  if (!label) return <span className="text-gray-400 text-xs">—</span>;
  const classes = VARIANTS[label] || VARIANTS.default;
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes}`}>{label}</span>;
};

export default StatusBadge;
