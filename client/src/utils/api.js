import axios from 'axios';

// Create axios instance
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// Property API endpoints
export const propertyAPI = {
  getAll: () => api.get('/properties'),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
};

// Payment API endpoints
export const paymentAPI = {
  getAll: () => api.get('/payments'),
  getByProperty: (propertyId) => api.get(`/payments/property/${propertyId}`),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// Dashboard API endpoints
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getPaymentTrends: () => api.get('/dashboard/payment-trends'),
  getDebtors: () => api.get('/dashboard/debtors'),
};

// Reports API endpoints
export const reportsAPI = {
  getMonthlyReport: (year, month) => api.get(`/reports/monthly/${year}/${month}`),
  getPropertyHistory: (propertyId) => api.get(`/reports/history/${propertyId}`),
  getDebtorsReport: () => api.get('/reports/debtors'),
  exportCSV: (params) => api.get('/reports/export/csv', { params, responseType: 'blob' }),
};