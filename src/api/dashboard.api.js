import apiClient from './client';

export const fetchDashboardSummary = ({ startDate, endDate } = {}) =>
  apiClient
    .get('/dashboard/summary', { params: { startDate, endDate } })
    .then((res) => res.data.data);
