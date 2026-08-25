import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ page, totalPages, totalRecords, onPageChange, loading }) => (
  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
    <span className="text-sm text-gray-500">
      {totalRecords > 0 ? `Showing page ${page} of ${totalPages} (${totalRecords} total)` : 'No records'}
    </span>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1 || loading}
        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-50"
      >
        <FiChevronLeft />
        Prev
      </button>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages || loading}
        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-50"
      >
        Next
        <FiChevronRight />
      </button>
    </div>
  </div>
);

export default Pagination;
