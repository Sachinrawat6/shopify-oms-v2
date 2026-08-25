import apiClient from './client';

export const fetchBlacklistedCustomers = ({ page = 1, limit = 50, search = '' } = {}) =>
  apiClient
    .get('/customers/blacklisted', { params: { page, limit, search } })
    .then((res) => res.data.data);

export const createBlacklistedCustomers = (customers) =>
  apiClient.post('/customers/blacklisted', customers).then((res) => res.data);
