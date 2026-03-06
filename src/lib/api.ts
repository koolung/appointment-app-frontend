import axios from 'axios';

const DEFAULT_API_URL = 'https://appointment-app-backend-production-d64e.up.railway.app';

const normalizeApiUrl = (url?: string) => {
  if (!url) return DEFAULT_API_URL;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signUp: (data: any) => api.post('/auth/sign-up', data),
  signIn: (data: any) => api.post('/auth/sign-in', data),
};

// Services APIs
export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id: string) => api.get(`/services/${id}`),
  getCategories: () => api.get('/services/categories'),
};

// Appointments APIs
export const appointmentsAPI = {
  create: (data: any) => api.post('/appointments', data),
  getById: (id: string) => api.get(`/appointments/${id}`),
  getMyAppointments: () => api.get('/appointments/my'),
  cancel: (id: string) => api.delete(`/appointments/${id}`),
  reschedule: (id: string, data: any) => api.put(`/appointments/${id}`, data),
};

// Employees APIs
export const employeesAPI = {
  getAll: () => api.get('/employees'),
  getById: (id: string) => api.get(`/employees/${id}`),
  getAvailability: (id: string, date: string) => api.get(`/employees/${id}/availability?date=${date}`),
};

export default api;

// Availability APIs
export const availabilityAPI = {
  checkSlots: (employeeId: string, date: string) => 
    api.get(`/availability/slots`, { params: { employeeId, date } }),
  getEmployeeSchedule: (employeeId: string, startDate: string, endDate: string) =>
    api.get(`/availability/schedule`, { params: { employeeId, startDate, endDate } }),
};

// Payments APIs
export const paymentsAPI = {
  create: (data: any) => api.post('/payments', data),
  getById: (id: string) => api.get(`/payments/${id}`),
};

// Reports APIs
export const reportsAPI = {
  getRevenue: (startDate: string, endDate: string) =>
    api.get('/reports/revenue', { params: { startDate, endDate } }),
  getPerformance: (startDate: string, endDate: string) =>
    api.get('/reports/performance', { params: { startDate, endDate } }),
};
