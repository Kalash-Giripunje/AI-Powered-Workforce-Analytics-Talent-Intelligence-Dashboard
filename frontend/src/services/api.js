import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for unified error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn('API Service Layer Notice:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
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

  // Settings
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (data) => apiClient.put('/settings', data),

  // Profile
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (data) => apiClient.put('/profile', data),

  // AI Intelligence
  sendChatMessage: (message, role, context) => apiClient.post('/chat', { message, role, context }),
  getAIInsights: (type, department) => apiClient.post('/ai-insights', { type, department }),

  // Executive Dashboard Analytics
  getDashboardAnalytics: () => apiClient.get('/analytics/dashboard'),
};

export default apiClient;
