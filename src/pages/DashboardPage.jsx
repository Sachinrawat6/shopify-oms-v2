import { useCallback, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { FiRefreshCw, FiCalendar, FiGrid } from 'react-icons/fi';
import { fetchDashboardSummary } from '../api/dashboard.api';
import SummaryCards from '../components/dashboard/SummaryCards';
import PendingBreakdown from '../components/dashboard/PendingBreakdown';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Dashboard defaults to "today" (matches the requirement: default today data,
// searchable by a start/end date range).
const DashboardPage = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashboardSummary({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });
      setSummary(data);
      console.log('dashboard data', data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const resetToToday = () => {
    setStartDate(new Date());
    setEndDate(new Date());
  };

  if (loading && !summary) return <LoadingState label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const pieData = {
    labels: ['Confirmed', 'Pending', 'Pre-Cancelled', 'Cancelled by Admin'],
    datasets: [
      {
        data: [summary.confirmed, summary.pending, summary.preCancelled, summary.cancelledByAdmin],
        backgroundColor: ['#10B981', '#F59E0B', '#FB923C', '#EF4444'],
        borderColor: ['#059669', '#D97706', '#EA580C', '#DC2626'],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['COD', 'Pre-Paid'],
    datasets: [
      {
        label: 'Orders',
        data: [summary.cod, summary.prepaid],
        backgroundColor: ['#3B82F6', '#10B981'],
        borderColor: ['#2563EB', '#059669'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FiGrid className="text-indigo-500" />
          Order Management Dashboard
        </h1>
        <button
          onClick={load}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
          <FiCalendar className="text-gray-400 mr-2" />
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="dd-MM-yyyy"
            className="w-28 focus:outline-none"
          />
        </div>
        <span className="text-gray-400">to</span>
        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
          <FiCalendar className="text-gray-400 mr-2" />
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            dateFormat="dd-MM-yyyy"
            className="w-28 focus:outline-none"
          />
        </div>
        <button
          onClick={resetToToday}
          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
        >
          Today
        </button>
      </div>

      <SummaryCards summary={summary} />

      <PendingBreakdown breakdown={summary.pendingBreakdown} finalPending={summary.finalPending} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h2>
          <div className="h-64">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">COD vs Pre-Paid</h2>
          <div className="h-64">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Total order value in range:{' '}
        <span className="font-semibold">₹{summary.totalValue?.toFixed(2)}</span>
        {' · '}Voided: <span className="font-semibold">{summary.voided}</span>
        {' · '}Hold: <span className="font-semibold">{summary.hold}</span>
        {' · '}Blacklisted: <span className="font-semibold">{summary.blacklisted}</span>
      </p>
    </div>
  );
};

export default DashboardPage;
