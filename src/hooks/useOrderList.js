// import { useCallback, useEffect, useRef, useState } from 'react';
// import { fetchOrders } from '../api/orders.api';

// // Shared list-fetching hook for every order page: handles pagination,
// // debounced search and date-range filtering so each page component only
// // needs to render.
// export default function useOrderList(resource, { limit = 500 } = {}) {
//   const [records, setRecords] = useState([]);
//   const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalRecords: 0, limit });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [search, setSearch] = useState('');
//   const [page, setPage] = useState(1);
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);

//   const debounceRef = useRef(null);

//   const load = useCallback(async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const data = await fetchOrders(resource, {
//         page,
//         limit,
//         search,
//         startDate: startDate ? startDate.toISOString() : undefined,
//         endDate: endDate ? endDate.toISOString() : undefined,
//       });
//       setRecords(data.records || []);
//       setPagination(data.pagination || { page: 1, totalPages: 1, totalRecords: 0, limit });
//     } catch (err) {
//       console.error(`Failed to fetch ${resource}:`, err.response?.data || err.message);
//       setError(err.response?.data?.message || `Failed to fetch ${resource}.`);
//       setRecords([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [resource, page, limit, search, startDate, endDate]);

//   useEffect(() => {
//     load();
//   }, [load]);

//   const handleSearchChange = (value) => {
//     setSearch(value);
//     if (debounceRef.current) clearTimeout(debounceRef.current);
//     debounceRef.current = setTimeout(() => setPage(1), 400);
//   };

//   const clearDateFilters = () => {
//     setStartDate(null);
//     setEndDate(null);
//     setPage(1);
//   };

//   return {
//     records,
//     pagination,
//     loading,
//     error,
//     search,
//     setSearch: handleSearchChange,
//     page,
//     setPage,
//     startDate,
//     setStartDate: (d) => {
//       setStartDate(d);
//       setPage(1);
//     },
//     endDate,
//     setEndDate: (d) => {
//       setEndDate(d);
//       setPage(1);
//     },
//     clearDateFilters,
//     refetch: load,
//   };
// }

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchOrders } from '../api/orders.api';

// Local date ko YYYY-MM-DD format mein convert karta hai (timezone-safe).
// toISOString() use nahi kar rahe kyunki wo UTC mein convert kar deta hai
// aur IST (UTC+5:30) mein ek din pehle ki date chali jaati hai.
const formatDate = (d) => {
  if (!d) return undefined;
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Shared list-fetching hook for every order page: handles pagination,
// debounced search and date-range filtering so each page component only
// needs to render.
export default function useOrderList(resource, { limit = 500 } = {}) {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalRecords: 0, limit });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const debounceRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchOrders(resource, {
        page,
        limit,
        search,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      });
      setRecords(data.records || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, totalRecords: 0, limit });
    } catch (err) {
      console.error(`Failed to fetch ${resource}:`, err.response?.data || err.message);
      setError(err.response?.data?.message || `Failed to fetch ${resource}.`);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [resource, page, limit, search, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchChange = (value) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 400);
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  return {
    records,
    pagination,
    loading,
    error,
    search,
    setSearch: handleSearchChange,
    page,
    setPage,
    startDate,
    setStartDate: (d) => {
      setStartDate(d);
      setPage(1);
    },
    endDate,
    setEndDate: (d) => {
      setEndDate(d);
      setPage(1);
    },
    clearDateFilters,
    refetch: load,
  };
}
