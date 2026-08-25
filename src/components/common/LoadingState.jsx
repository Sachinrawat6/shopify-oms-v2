import { PulseLoader } from 'react-spinners';

const LoadingState = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center h-64">
    <PulseLoader color="#4F46E5" size={10} />
    <p className="mt-4 text-gray-600">{label}</p>
  </div>
);

export default LoadingState;
