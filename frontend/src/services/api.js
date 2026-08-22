import axios from 'axios';

const AUTH_TOKEN_KEY = 'nexus_hrms_auth_token';
const AUTH_USER_KEY = 'nexus_hrms_auth_user';

// Normalize API base URL: accept either a full URL (e.g. http://127.0.0.1:8000 or http://127.0.0.1:8000/api)
// or fall back to the development proxy path '/api'. If VITE_API_URL is set but
// does not include the '/api' path segment, append it so apiClient requests go to
// the correct backend routes (e.g. /api/employees).
const rawApiUrl = import.meta.env.VITE_API_URL;
let API_BASE_URL = '/api';
if (rawApiUrl && rawApiUrl.length > 0) {
  const trimmed = rawApiUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    API_BASE_URL = trimmed;
  } else {
    API_BASE_URL = `${trimmed}/api`;
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function persistAuthSession(token, user) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

// Request interceptor: attach bearer token if available
apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = config.headers || {};
    if (!String(config.headers.Authorization || '').startsWith('Bearer ')) {
      config.headers.Authorization = 'Bearer ' + token;
    }
  }
  return config;
});


apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn('API Service Layer Notice:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),

  // Health
  getHealth: () => apiClient.get('/health'),

  // Employees
  getEmployees: (params) => apiClient.get('/employees', { params }),
  getEmployeeById: (empId) => apiClient.get(`/employees/${empId}`),
  createEmployee: (data) => apiClient.post('/employees', data),
  updateEmployee: (empId, data) => apiClient.put(`/employees/${empId}`, data),
  deleteEmployee: (empId) => apiClient.delete(`/employees/${empId}`),

  // Attendance
  getAttendance: (params) => apiClient.get('/attendance', { params }),
  getAttendanceAnomalies: () => apiClient.get('/attendance/anomalies'),
  checkIn: (data) => apiClient.post('/attendance/check-in', data),
  checkOut: (data) => apiClient.post('/attendance/check-out', data),

  // Leaves
  getLeaves: (params) => apiClient.get('/leaves', { params }),
  getLeaveBalance: () => apiClient.get('/leaves/balance'),
  submitLeave: (data) => apiClient.post('/leaves', data),
  updateLeaveStatus: (leaveId, status, approverComments) =>
    apiClient.put(`/leaves/${leaveId}/status`, { status, approverComments }),

  // Shifts
  getShifts: (params) => apiClient.get('/shifts', { params }),
  submitShiftRequest: (data) => apiClient.post('/shifts', data),
  updateShiftStatus: (shiftId, status) => apiClient.put(`/shifts/${shiftId}/status`, { status }),

  // Timesheets
  getTimesheets: (params) => apiClient.get('/timesheets', { params }),
  submitTimesheet: (data) => apiClient.post('/timesheets', data),
  updateTimesheetStatus: (timesheetId, status) => apiClient.put(`/timesheets/${timesheetId}/status`, null, { params: { new_status: status } }),

  // Payroll
  getPayroll: (params) => apiClient.get('/payroll', { params }),
  calculatePayroll: (month) => apiClient.post('/payroll/calculate', null, { params: { month } }),
  disbursePayroll: (payrollId) => apiClient.put(`/payroll/${payrollId}/disburse`),
  // Download payslip PDF (returns blob)
  downloadPayslip: (empId, month) => apiClient.get(`/payroll/${empId}/payslip`, { params: { month }, responseType: 'blob' }),
  // Export payroll CSV (returns blob)
  exportPayroll: (month) => apiClient.get('/payroll/export', { params: { month }, responseType: 'blob' }),

  // Performance
  getPerformance: () => apiClient.get('/performance'),
  getEmployeePerformance: (empId) => apiClient.get(`/performance/${empId}`),

  // Notifications
  getNotifications: () => apiClient.get('/notifications'),
  markNotificationRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.post('/notifications/mark-all-read'),

  // Audit Logs
  getAuditLogs: () => apiClient.get('/audit-logs'),
  createAuditLog: (data) => apiClient.post('/audit-logs', data),

  // Reports
  generateReport: (data) => apiClient.post('/reports/generate', data),
  getReportSummary: () => apiClient.get('/reports/summary'),
  // Download report by relative URL (returns a blob)
  downloadReportByUrl: (downloadUrl) => apiClient.get(downloadUrl, { responseType: 'blob' }),

  // Settings
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (data) => apiClient.put('/settings', data),

  // Profile
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (data) => apiClient.put('/profile', data),

  // Change password
  changePassword: (payload) => apiClient.post('/auth/change-password', payload),

  // Holidays
  getHolidays: (month) => apiClient.get('/holidays', { params: { month } }),

  // AI Intelligence
  sendChatMessage: (message, role, context) => apiClient.post('/chat', { message, role, context }),
  getAIInsights: (type, department) => apiClient.post('/ai-insights', { type, department }),

  // Executive Dashboard Analytics
  getDashboardAnalytics: () => apiClient.get('/analytics/dashboard'),
};

export default apiClient;