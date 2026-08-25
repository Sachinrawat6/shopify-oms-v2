const OrderTable = ({
  columns,
  rows,
  renderRowActions,
  emptyMessage = 'No orders found.',
  selectable = false,
  selectedRows = [],
  onRowSelect = () => {},
  onSelectAll = () => {},
}) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRows.length === rows.length}
                  onChange={(e) => onSelectAll(e.target.checked, rows)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
            {renderRowActions && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.length > 0 ? (
            rows.map((row, idx) => {
              const rowId = row._id || row.order_id || idx;
              const isSelected = selectedRows.some((r) => (r._id || r.order_id || idx) === rowId);

              return (
                <tr
                  key={rowId}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  {selectable && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onRowSelect(row)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {col.render ? col.render(row) : (row[col.key] ?? 'N/A')}
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {renderRowActions(row)}
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={columns.length + (renderRowActions ? 1 : 0) + (selectable ? 1 : 0)}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default OrderTable;
