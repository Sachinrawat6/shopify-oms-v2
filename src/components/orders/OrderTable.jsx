import React, { useRef, useEffect } from 'react';

const OrderTable = ({
  columns,
  rows,
  renderRowActions,
  emptyMessage = 'No orders found.',
  selectable = false,
  selectedRows = [],
  onRowSelect = () => {},
  onSelectAll = () => {},
}) => {
  const headerCheckboxRef = useRef(null);

  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < rows.length;

  // Indeterminate state for header checkbox
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const totalCols = columns.length + (renderRowActions ? 1 : 0) + (selectable ? 1 : 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* ---------- HEADER ---------- */}
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
            <tr>
              {selectable && (
                <th scope="col" className="w-12 px-4 py-3.5">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked, rows)}
                    aria-label="Select all rows"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600
                               focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-0
                               cursor-pointer transition"
                  />
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-3.5 text-left text-[11px] font-semibold
                             text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}

              {renderRowActions && (
                <th
                  scope="col"
                  className="px-4 py-3.5 text-right text-[11px] font-semibold
                             text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* ---------- BODY ---------- */}
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.length > 0 ? (
              rows.map((row, idx) => {
                const rowId = row._id || row.order_id || idx;
                const isSelected = selectedRows.some((r) => (r._id || r.order_id || idx) === rowId);

                return (
                  <tr
                    key={rowId}
                    className={`
                      group transition-colors duration-150
                      ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50/70'}
                    `}
                  >
                    {selectable && (
                      <td className="w-12 px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onRowSelect(row)}
                          aria-label={`Select row ${rowId}`}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600
                                     focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-0
                                     cursor-pointer transition"
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3.5 whitespace-nowrap text-sm
                                   text-gray-700 group-hover:text-gray-900 transition-colors"
                      >
                        {col.render
                          ? col.render(row)
                          : (row[col.key] ?? <span className="text-gray-400 italic">N/A</span>)}
                      </td>
                    ))}

                    {renderRowActions && (
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right">
                        {renderRowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              /* ---------- EMPTY STATE ---------- */
              <tr>
                <td colSpan={totalCols} className="px-6 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <svg
                        className="w-7 h-7 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">{emptyMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try adjusting your filters or search.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
