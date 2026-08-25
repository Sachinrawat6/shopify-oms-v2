const ErrorState = ({ message, onRetry }) => (
  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
    <p className="text-red-700">Error: {message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorState;
