import { useState } from 'react';

const API_URL = 'http://localhost:5000/api/v1/orders/sales';

const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n || 0);

const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// ---- CSV helpers ----
function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function isRefundOrder(o) {
  return (o.transactions || []).some((t) => t.kind === 'REFUND');
}

function buildOrdersCsv(orders) {
  const rows = [
    ['Order name', 'Created at', 'Payment status', 'Payment gateway'],
    ...orders.map((o) => [
      o.name,
      o.createdAt,
      o.displayFinancialStatus,
      (o.paymentGatewayNames || []).join(' / '),
    ]),
  ];
  return rowsToCsv(rows);
}

function buildSummaryCsv(summary, startDate, endDate) {
  const rows = [
    ['Sales Summary', `${startDate} to ${endDate}`],
    [],
    ['Orders'],
    ['Total orders', summary.orders.totalOrders],
    ['Cancelled orders', summary.orders.cancelledOrders],
    ['Valid orders', summary.orders.validOrders],
    [],
    ['Sales'],
    ['Gross sales amount', summary.sales.grossSalesAmount],
    ['Net sales amount', summary.sales.netSalesAmount],
    ['Average order value', summary.sales.averageOrderValue],
    [],
    ['Returns'],
    ['Orders with return', summary.returns.ordersWithReturn],
    ['Total return requests', summary.returns.totalReturnRequests],
    ['Total returned quantity', summary.returns.totalReturnedQuantity],
    ['Total returned amount', summary.returns.totalReturnedAmount],
    [],
    ['Return status breakdown'],
    ...Object.entries(summary.returns.returnStatusBreakdown).map(([k, v]) => [k, v]),
    [],
    ['Return reason breakdown'],
    ...Object.entries(summary.returns.returnReasonBreakdown).map(([k, v]) => [k, v]),
    [],
    ['Refunds'],
    ['Total refunded amount', summary.refunds.totalRefundedAmount],
    ['Total refund failed amount', summary.refunds.totalRefundFailedAmount],
    ['Total refund pending amount', summary.refunds.totalRefundPendingAmount],
    ['Refund success count', summary.refunds.refundSuccessCount],
    ['Refund error count', summary.refunds.refundErrorCount],
    ['Refund pending count', summary.refunds.refundPendingCount],
    [],
    ['Payment gateway breakdown'],
    ['Gateway', 'Order count', 'Amount'],
    ...Object.entries(summary.paymentGatewayBreakdown).map(([gw, d]) => [
      gw,
      d.orderCount,
      d.amount,
    ]),
  ];
  return rowsToCsv(rows);
}

// ---- Small building blocks ----

function Figure({ label, value, tone = 'default', sub }) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-800'
      : tone === 'negative'
        ? 'text-rose-800'
        : 'text-stone-900';
  return (
    <div className="border border-stone-200 bg-white px-5 py-4">
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-stone-400">{sub}</div>}
    </div>
  );
}

function SectionHeading({ children, action }) {
  return (
    <div className="flex items-baseline justify-between border-b border-stone-300 pb-2 mb-4">
      <h2 className="text-lg font-semibold text-stone-900">{children}</h2>
      {action}
    </div>
  );
}

function BreakdownTable({ title, data, total }) {
  const entries = Object.entries(data || {});
  return (
    <div className="border border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">
        {title}
      </div>
      {entries.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-stone-400">No data</div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {entries.map(([key, value]) => {
              const pct = total ? ((value / total) * 100).toFixed(1) : null;
              return (
                <tr key={key} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-2 text-stone-700">{key}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-stone-900">
                    {fmtNum(value)}
                  </td>
                  {pct !== null && (
                    <td className="px-4 py-2 text-right text-xs text-stone-400 w-16">{pct}%</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---- Main page ----

export default function SalesSummaryPage() {
  const [startDate, setStartDate] = useState(daysAgoISO(30));
  const [endDate, setEndDate] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const json = await res.json();
      const summaryData = json.data?.summary ?? json.data;
      const ordersData = json.data?.orders ?? [];
      setSummary(summaryData);
      setOrders(ordersData);
      setHasFetched(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch sales summary');
      setSummary(null);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSummary = () => {
    if (!summary) return;
    const csv = buildSummaryCsv(summary, startDate, endDate);
    downloadCsv(`sales-summary_${startDate}_to_${endDate}.csv`, csv);
  };

  const handleExportSalesOrders = () => {
    if (!orders.length) return;
    const csv = buildOrdersCsv(orders);
    downloadCsv(`sales-orders_${startDate}_to_${endDate}.csv`, csv);
  };

  const handleExportReturnOrders = () => {
    const returnOrders = orders.filter((o) => (o.returns?.edges || []).length > 0);
    if (!returnOrders.length) return;
    const csv = buildOrdersCsv(returnOrders);
    downloadCsv(`return-orders_${startDate}_to_${endDate}.csv`, csv);
  };

  const refundOrders = orders.filter(isRefundOrder);

  const handleExportRefundOrders = () => {
    if (!refundOrders.length) return;
    const csv = buildOrdersCsv(refundOrders);
    downloadCsv(`refund-orders_${startDate}_to_${endDate}.csv`, csv);
  };

  const returnRatePct =
    summary && summary.orders.validOrders > 0
      ? ((summary.returns.ordersWithReturn / summary.orders.validOrders) * 100).toFixed(1)
      : null;

  const refundImpactPct =
    summary && summary.sales.grossSalesAmount > 0
      ? ((summary.refunds.totalRefundedAmount / summary.sales.grossSalesAmount) * 100).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-900">Sales Summary</h1>
          <p className="mt-1 text-sm text-stone-500">
            Orders, returns and refunds for a chosen date range.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-wrap items-end gap-3 border border-stone-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="startDate" className="text-xs text-stone-500">
              From
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-stone-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="endDate" className="text-xs text-stone-500">
              To
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              min={startDate}
              max={todayISO()}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-stone-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
          </div>
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="bg-stone-900 px-5 py-1.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Get summary'}
          </button>
        </div>

        {summary && (
          <div className="mb-8 flex flex-wrap items-center gap-2 border border-stone-200 bg-white px-5 py-3">
            <span className="text-xs text-stone-500 mr-1">Download CSV:</span>
            <button
              onClick={handleExportSummary}
              className="border border-stone-300 px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
            >
              Summary report
            </button>
            <button
              onClick={handleExportSalesOrders}
              disabled={!orders.length}
              className="border border-stone-300 px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Sales orders ({fmtNum(orders.length)})
            </button>
            <button
              onClick={handleExportReturnOrders}
              disabled={!summary.returns.ordersWithReturn}
              className="border border-stone-300 px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Return orders ({fmtNum(summary.returns.ordersWithReturn)})
            </button>
            <button
              onClick={handleExportRefundOrders}
              disabled={!refundOrders.length}
              className="border border-stone-300 px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Refund orders ({fmtNum(refundOrders.length)})
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {!hasFetched && !loading && !error && (
          <div className="border border-dashed border-stone-300 px-6 py-16 text-center text-sm text-stone-400">
            Choose a date range and select "Get summary" to load data.
          </div>
        )}

        {summary && (
          <div className="space-y-10">
            {/* Top figures */}
            <div>
              <SectionHeading>Overview</SectionHeading>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Figure label="Total orders" value={fmtNum(summary.orders.totalOrders)} />
                <Figure label="Cancelled orders" value={fmtNum(summary.orders.cancelledOrders)} />
                <Figure label="Valid orders" value={fmtNum(summary.orders.validOrders)} />
                <Figure
                  label="Gross sales"
                  value={fmtINR(summary.sales.grossSalesAmount)}
                  tone="positive"
                />
                <Figure
                  label="Net sales"
                  value={fmtINR(summary.sales.netSalesAmount)}
                  sub="after returns & refunds"
                />
                <Figure
                  label="Average order value"
                  value={fmtINR(summary.sales.averageOrderValue)}
                />
              </div>
            </div>

            {/* Returns */}
            <div>
              <SectionHeading>Returns</SectionHeading>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
                <Figure
                  label="Orders with return"
                  value={fmtNum(summary.returns.ordersWithReturn)}
                  sub={returnRatePct !== null ? `${returnRatePct}% of valid orders` : undefined}
                />
                <Figure
                  label="Return requests"
                  value={fmtNum(summary.returns.totalReturnRequests)}
                />
                <Figure
                  label="Returned quantity"
                  value={fmtNum(summary.returns.totalReturnedQuantity)}
                />
                <Figure
                  label="Returned amount"
                  value={fmtINR(summary.returns.totalReturnedAmount)}
                  tone="negative"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <BreakdownTable
                  title="By status"
                  data={summary.returns.returnStatusBreakdown}
                  total={summary.returns.totalReturnRequests}
                />
                <BreakdownTable title="By reason" data={summary.returns.returnReasonBreakdown} />
              </div>
            </div>

            {/* Refunds */}
            <div>
              <SectionHeading>Refunds</SectionHeading>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-4">
                <Figure
                  label="Refunded"
                  value={fmtINR(summary.refunds.totalRefundedAmount)}
                  sub={`${fmtNum(summary.refunds.refundSuccessCount)} successful transactions`}
                  tone="negative"
                />
                <Figure
                  label="Failed refunds"
                  value={fmtINR(summary.refunds.totalRefundFailedAmount)}
                  sub={`${fmtNum(summary.refunds.refundErrorCount)} failed transactions`}
                />
                <Figure
                  label="Pending refunds"
                  value={fmtINR(summary.refunds.totalRefundPendingAmount)}
                  sub={`${fmtNum(summary.refunds.refundPendingCount)} pending transactions`}
                />
              </div>
              {refundImpactPct !== null && (
                <p className="text-xs text-stone-500">
                  Refunds equal {refundImpactPct}% of gross sales in this period.
                </p>
              )}
            </div>

            {/* Payment gateways */}
            <div>
              <SectionHeading>By payment method</SectionHeading>
              <div className="border border-stone-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                      <th className="px-4 py-2.5 font-medium">Gateway</th>
                      <th className="px-4 py-2.5 font-medium text-right">Orders</th>
                      <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summary.paymentGatewayBreakdown || {}).map(([gw, d]) => (
                      <tr key={gw} className="border-b border-stone-100 last:border-0">
                        <td className="px-4 py-2.5 text-stone-700">{gw}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {fmtNum(d.orderCount)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtINR(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
