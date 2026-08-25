import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiCalendar } from 'react-icons/fi';

const DateRangeFilter = ({ startDate, endDate, onStartChange, onEndChange, onClear }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
      <FiCalendar className="text-gray-400 mr-2" />
      <DatePicker
        selected={startDate}
        onChange={onStartChange}
        selectsStart
        startDate={startDate}
        endDate={endDate}
        placeholderText="Start Date"
        dateFormat="dd-MM-yyyy"
        className="w-28 focus:outline-none"
      />
    </div>
    <span className="text-gray-400">to</span>
    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
      <FiCalendar className="text-gray-400 mr-2" />
      <DatePicker
        selected={endDate}
        onChange={onEndChange}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        placeholderText="End Date"
        dateFormat="dd-MM-yyyy"
        className="w-28 focus:outline-none"
      />
    </div>
    {(startDate || endDate) && (
      <button
        onClick={onClear}
        className="text-sm font-medium text-gray-500 bg-red-100 py-2 px-4 rounded hover:text-red-700 hover:bg-red-200"
      >
        Clear
      </button>
    )}
  </div>
);

export default DateRangeFilter;
