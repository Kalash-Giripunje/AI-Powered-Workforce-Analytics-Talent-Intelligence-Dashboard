import React, { useState, useEffect } from 'react';
import {
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_PERFORMANCE,
  INITIAL_LEAVE_BALANCE
} from './data/mockData';

import { api, clearAuthSession, persistAuthSession } from './services/api';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Auth
import { LoginPage } from './components/auth/LoginPage';

// Views
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { ManagerDashboard } from './components/dashboard/ManagerDashboard';
import { EmployeeManagement } from './components/employees/EmployeeManagement';
import { AttendanceManagement } from './components/attendance/AttendanceManagement';
import { LeaveManagement } from './components/leave/LeaveManagement';
import { ShiftManagement } from './components/shifts/ShiftManagement';
import { TimesheetManagement } from './components/timesheets/TimesheetManagement';
import { PayrollManagement } from './components/payroll/PayrollManagement';
import { AIWorkforcePlanning } from './components/ai/AIWorkforcePlanning';
import { ReportsCenter } from './components/reports/ReportsCenter';
import { SettingsPage } from './components/settings/SettingsPage';

// Overlays
import { AIChatbotModal } from './components/ai/AIChatbotModal';
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';

const AUTH_USER_KEY = 'nexus_hrms_auth_user';

function normalizeRole(value) {
  if (!value) return 'EMPLOYEE';
  const role = String(value).toUpperCase();
  if (role.includes('MANAGER')) return 'MANAGER';
  if (role.includes('HR') || role.includes('ADMIN')) return 'HR_ADMIN';
  return 'EMPLOYEE';
}

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState(getStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(authenticatedUser));
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [lastLoginPassword, setLastLoginPassword] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    setAuthError('');
    // retain the raw password in transient state (NOT persisted) to allow a smooth change-password flow
    setLastLoginPassword(credentials.password);
    try {
      const response = await api.login(credentials);
      const user = response?.user ?? null;
      const token = response?.token ?? null;
      if (!user || !token) {
        throw new Error('Authentication failed.');
      }
      persistAuthSession(token, user);
      setAuthenticatedUser(user);
      setIsAuthenticated(true);
      // Land employees on their personal dashboard after login
      setActiveTab('dashboard');
      // If the account is using the default password, prompt the user (they may keep default or change it)
      if (user?.passwordStatus === 'default') {
        setShowChangePasswordModal(true);
      }
    } catch (error) {
      const message = error?.response?.data?.detail || error.message || 'Unable to connect to the authentication service.';
      setAuthError(message);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileUpdated = async (updatedProfile) => {
    if (!updatedProfile || typeof updatedProfile !== 'object') {
      try {
        const data = await api.getProfile();
        setProfile(data || null);
      } catch (err) {
        console.error('Failed to refresh profile after update:', err);
      }
      return;
    }

    setProfile((prev) => ({
      ...(prev || {}),
      ...updatedProfile,
      avatar: null,
      avatarId: updatedProfile.avatarId || prev?.avatarId || 'avatar-01',
    }));
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      clearAuthSession();
      setAuthenticatedUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setSelectedAttendanceEmployeeId('');
      setAuthError('');
      setActiveTab('dashboard');
    }
  };

  // Domain States
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  // employee pagination metadata (server-side)
  const [employeePagination, setEmployeePagination] = useState({ total: 0, page: 1, size: 50, pages: 1 });
  const [selectedAttendanceEmployeeId, setSelectedAttendanceEmployeeId] = useState('');
  const [selectedLeaveEmployeeId, setSelectedLeaveEmployeeId] = useState('');
  const [selectedShiftEmployeeId, setSelectedShiftEmployeeId] = useState('');
  const [selectedTimesheetEmployeeId, setSelectedTimesheetEmployeeId] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendancePagination, setAttendancePagination] = useState({ total: 0, page: 1, size: 50, pages: 1 });
  const [leaves, setLeaves] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftError, setShiftError] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [timesheetsLoading, setTimesheetsLoading] = useState(false);
  const [timesheetsError, setTimesheetsError] = useState(null);
  const [payroll, setPayroll] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [profile, setProfile] = useState(null);
  // Default to non-privileged role when role is missing to avoid accidental privilege escalation in the UI
  const userRole = normalizeRole(authenticatedUser?.role || profile?.role || 'EMPLOYEE');
  const currentEmpName = authenticatedUser?.name || profile?.name || 'User';
  const currentEmpId = authenticatedUser?.empId || profile?.empId || null;
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState({
    casualLeave: { total: 0, used: 0, remaining: 0 },
    sickLeave: { total: 0, used: 0, remaining: 0 },
    earnedLeave: { total: 0, used: 0, remaining: 0 },
    parentalLeave: { total: 0, used: 0, remaining: 0 }
  });
  const isHrAdmin = userRole === 'HR_ADMIN';
  const isManager = userRole === 'MANAGER';
  const canViewTeam = isHrAdmin || isManager;

  // Punch State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentCheckInTime, setCurrentCheckInTime] = useState(null);
  const [attendanceSessionCompleted, setAttendanceSessionCompleted] = useState(false);
  const [currentCheckOutTime, setCurrentCheckOutTime] = useState(null);
  const [gpsStatus, setGpsStatus] = useState({
    state: 'idle',
    message: 'Location check will run before attendance is recorded.',
    distance: null,
  });

  // Holidays state for Attendance UI
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [holidaysError, setHolidaysError] = useState(null);

  // Overlays
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const existingToken = localStorage.getItem('nexus_hrms_auth_token');
      if (!existingToken) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const currentUser = await api.getCurrentUser();
        const restoredRole = normalizeRole(currentUser?.role || 'EMPLOYEE');
        setAuthenticatedUser(currentUser || null);
        setIsAuthenticated(Boolean(currentUser));
        // Ensure employees land on their personal dashboard after session restore
        setActiveTab('dashboard');

        // If restored user is still on default password, prompt them
        if (currentUser?.passwordStatus === 'default') {
          setShowChangePasswordModal(true);
        }

        const profileData = await api.getProfile();
        setProfile(profileData || null);
        if (profileData?.empId && normalizeRole(currentUser?.role) === 'EMPLOYEE') {
          setSelectedAttendanceEmployeeId(profileData.empId);
        }
      } catch (error) {
        clearAuthSession();
        setAuthenticatedUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setAuthError('Your session has expired. Please sign in again.');
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    fetchProfile();

    if (isHrAdmin) {
      fetchDashboardMetrics();
      fetchAuditLogs();
    } else {
      setDashboardMetrics(null);
      setDashboardError(null);
      setAuditLogs([]);
      setAuditLogsError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isHrAdmin]);

  async function fetchProfile() {
    try {
      const data = await api.getProfile();
      setProfile(data || null);
      const empIdFromProfile = data && (data.empId || data.EmpID || data.EmpId || data.empID);
      if (empIdFromProfile && userRole === 'EMPLOYEE') {
        setSelectedAttendanceEmployeeId(empIdFromProfile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setProfile(null);
    }
  }

  async function fetchDashboardMetrics() {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const data = await api.getDashboardAnalytics();
      setDashboardMetrics(data || null);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load dashboard metrics';
      setDashboardError(message);
    } finally {
      setDashboardLoading(false);
    }
  }

  async function fetchNotifications() {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const resp = await api.getNotifications();
      const items = Array.isArray(resp) ? resp : [];
      const mapped = items.map((notification) => ({
        ...notification,
        read: notification.read ?? notification.isRead ?? false
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load notifications';
      setNotificationsError(message);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function fetchAuditLogs() {
    setAuditLogsLoading(true);
    setAuditLogsError(null);
    try {
      const resp = await api.getAuditLogs();
      const items = Array.isArray(resp) ? resp : [];
      setAuditLogs(items);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load audit logs';
      setAuditLogsError(message);
      setAuditLogs([]);
    } finally {
      setAuditLogsLoading(false);
    }
  }

  // Fetch employees from API
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!canViewTeam) {
      setEmployees([]);
      setEmployeesError(null);
      return;
    }
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, canViewTeam]);

  async function fetchEmployees(params = {}) {
    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      const resp = await api.getEmployees(params);
      const items = resp && resp.items ? resp.items : [];
      setEmployees(items);
      // capture pagination metadata
      const pagination = {
        total: (resp && typeof resp.total === 'number') ? resp.total : 0,
        page: (resp && typeof resp.page === 'number') ? resp.page : (params.page || 1),
        size: (resp && typeof resp.size === 'number') ? resp.size : (params.size || 50),
        pages: (resp && typeof resp.pages === 'number') ? resp.pages : (Math.ceil(((resp && resp.total) || 0) / (params.size || 50)))
      };
      setEmployeePagination(pagination);
    } catch (err) {
      console.error('Failed to load employees:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load employees';
      setEmployeesError(message);
    } finally {
      setEmployeesLoading(false);
    }
  }

  // Fetch attendance from API (read-only integration)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAttendance();
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // When selected employee changes, update punch state from existing attendance list
  useEffect(() => {
    updateAttendancePunchState(attendance, selectedAttendanceEmployeeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttendanceEmployeeId]);

  // Fetch holidays for the current month
  async function fetchHolidays() {
    setHolidaysLoading(true);
    setHolidaysError(null);
    try {
      const now = new Date();
      const monthParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const resp = await api.getHolidays(monthParam);
      const items = Array.isArray(resp) ? resp : [];
      setHolidays(items);
    } catch (err) {
      console.error('Failed to load holidays:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load holidays';
      setHolidaysError(message);
      setHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  }
  // Helper: derive punch state from attendance list and selected employee
  function updateAttendancePunchState(attList, empId) {
    if (!empId) {
      setIsCheckedIn(false);
      setCurrentCheckInTime(null);
      setAttendanceSessionCompleted(false);
      setCurrentCheckOutTime(null);
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const rec = (attList || []).find((r) => (r.empId || r.EmpID || r.EmpId) === empId && (r.date || r.Date) === todayStr);
    if (!rec) {
      setIsCheckedIn(false);
      setCurrentCheckInTime(null);
      setAttendanceSessionCompleted(false);
      setCurrentCheckOutTime(null);
      return;
    }

    // Normalize fields
    const checkInVal = rec.checkIn || rec.CheckIn || null;
    const checkOutVal = rec.checkOut || rec.CheckOut || null;

    if (checkInVal && (!checkOutVal || checkOutVal === null)) {
      // checked in but not yet checked out
      setIsCheckedIn(true);
      setCurrentCheckInTime(checkInVal);
      setAttendanceSessionCompleted(false);
      setCurrentCheckOutTime(null);
    } else if (checkInVal && checkOutVal) {
      // already checked out
      setIsCheckedIn(false);
      setCurrentCheckInTime(checkInVal);
      setAttendanceSessionCompleted(true);
      setCurrentCheckOutTime(checkOutVal);
    } else {
      setIsCheckedIn(false);
      setCurrentCheckInTime(null);
      setAttendanceSessionCompleted(false);
      setCurrentCheckOutTime(null);
    }
  }

  async function fetchAttendance(params = {}) {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const finalParams = canViewTeam ? params : { ...params, empId: currentEmpId || selectedAttendanceEmployeeId };
      const resp = await api.getAttendance(finalParams);
      const items = resp && resp.items ? resp.items : [];
      const pagination = {
        total: (resp && typeof resp.total === 'number') ? resp.total : 0,
        page: (resp && typeof resp.page === 'number') ? resp.page : (params.page || 1),
        size: (resp && typeof resp.size === 'number') ? resp.size : (params.size || 50),
        pages: (resp && typeof resp.pages === 'number') ? resp.pages : (Math.ceil(((resp && resp.total) || 0) / (params.size || 50)))
      };
      setAttendancePagination(pagination);

      const visibleItems = canViewTeam ? items : (items || []).filter((r) => {
        const rid = r?.empId || r?.EmpID || r?.EmpId || r?.employeeId || null;
        return rid && String(rid) === String(currentEmpId || selectedAttendanceEmployeeId);
      });
      setAttendance(visibleItems);
      // Update punch state for the currently selected employee based on fresh attendance data
      updateAttendancePunchState(visibleItems, selectedAttendanceEmployeeId || currentEmpId);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load attendance';
      setAttendanceError(message);
    } finally {
      setAttendanceLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLeaves();
    fetchLeaveBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function fetchLeaves(params = {}) {
    setLeaveLoading(true);
    setLeaveError(null);
    try {
      const finalParams = canViewTeam ? params : { ...params, empId: currentEmpId || selectedLeaveEmployeeId };
      const resp = await api.getLeaves(finalParams);
      const items = Array.isArray(resp) ? resp : [];
      const visible = canViewTeam ? items : (items || []).filter((l) => {
        const lid = l?.empId || l?.EmpID || l?.EmpId || l?.employeeId || null;
        return lid && String(lid) === String(currentEmpId || selectedLeaveEmployeeId);
      });
      setLeaves(visible);
    } catch (err) {
      console.error('Failed to load leaves:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load leaves';
      setLeaveError(message);
    } finally {
      setLeaveLoading(false);
    }
  }

  async function fetchLeaveBalance() {
    try {
      const balance = await api.getLeaveBalance();
      setLeaveBalance(balance || {
        casualLeave: { total: 0, used: 0, remaining: 0 },
        sickLeave: { total: 0, used: 0, remaining: 0 },
        earnedLeave: { total: 0, used: 0, remaining: 0 },
        parentalLeave: { total: 0, used: 0, remaining: 0 }
      });
    } catch (err) {
      console.error('Failed to load leave balance:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load leave balance';
      setLeaveError(message);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function fetchShifts(params = {}) {
    setShiftLoading(true);
    setShiftError(null);
    try {
      const resp = await api.getShifts(params);
      const items = Array.isArray(resp) ? resp : [];
      setShifts(items);
    } catch (err) {
      console.error('Failed to load shifts:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load shifts';
      setShiftError(message);
    } finally {
      setShiftLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTimesheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function fetchTimesheets(params = {}) {
    setTimesheetsLoading(true);
    setTimesheetsError(null);
    try {
      const resp = await api.getTimesheets(params);
      const items = Array.isArray(resp) ? resp : [];
      setTimesheets(items);
    } catch (err) {
      console.error('Failed to load timesheets:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load timesheets';
      setTimesheetsError(message);
    } finally {
      setTimesheetsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function fetchPayroll(params = {}) {
    setPayrollLoading(true);
    setPayrollError(null);
    try {
      const finalParams = canViewTeam ? params : { ...params, empId: currentEmpId };
      const resp = await api.getPayroll(finalParams);
      const items = Array.isArray(resp) ? resp : [];
      const visible = canViewTeam ? items : (items || []).filter((p) => {
        const pid = p?.empId || p?.EmpID || p?.EmpId || p?.employeeId || null;
        return pid && String(pid) === String(currentEmpId);
      });
      setPayroll(visible);
    } catch (err) {
      console.error('Failed to load payroll:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load payroll';
      setPayrollError(message);
    } finally {
      setPayrollLoading(false);
    }
  }

  // Handlers
  const handleAddEmployee = async (newEmp) => {
    try {
      await api.createEmployee(newEmp);
      await fetchEmployees();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to create employee';
      alert(message);
    }
  };

  const handleUpdateEmployee = async (updatedEmp) => {
    try {
      const empId = updatedEmp.empId;
      await api.updateEmployee(empId, updatedEmp);
      await fetchEmployees();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to update employee';
      alert(message);
    }
  };

  const requestCurrentLocation = () => new Promise((resolve, reject) => {
    if (!navigator || !navigator.geolocation) {
      reject(new Error('Location services are not available in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let message = 'Unable to determine your location.';
        if (error.code === 1) {
          message = 'Location permission is required to check in.';
        } else if (error.code === 2) {
          message = 'Location services are unavailable right now.';
        } else if (error.code === 3) {
          message = 'Location request timed out. Please try again.';
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });

  const handleCheckIn = async () => {
    if (!selectedAttendanceEmployeeId) {
      alert('Please select an employee before checking in.');
      return;
    }

    try {
      setGpsStatus({ state: 'requesting', message: 'Requesting location...', distance: null });
      const coords = await requestCurrentLocation();
      setGpsStatus({ state: 'verifying', message: 'Verifying location...', distance: null });

      const record = await api.checkIn({
        empId: selectedAttendanceEmployeeId,
        ...coords,
      });

      const checkInVal = record?.checkIn || record?.CheckIn || null;
      const distance = record?.distanceFromOffice ?? record?.DistanceFromOffice ?? null;
      const geofenceStatus = record?.geofenceStatus || record?.GeofenceStatus || 'INSIDE';
      if (checkInVal) {
        setIsCheckedIn(true);
        setCurrentCheckInTime(checkInVal);
        setAttendanceSessionCompleted(false);
        setCurrentCheckOutTime(null);
      }
      setGpsStatus({
        state: 'success',
        message: geofenceStatus === 'INSIDE'
          ? `Attendance verified successfully${distance !== null ? ` • Distance from office: ${Math.round(distance)} m` : ''}.`
          : 'Attendance verification failed.',
        distance,
      });
      await fetchAttendance();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to check in employee';
      setGpsStatus({ state: 'error', message, distance: null });
      alert(message);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedAttendanceEmployeeId) {
      alert('Please select an employee before checking out.');
      return;
    }

    try {
      let payload = { empId: selectedAttendanceEmployeeId };
      if (navigator && navigator.geolocation) {
        setGpsStatus({ state: 'requesting', message: 'Requesting location...', distance: null });
        const coords = await requestCurrentLocation();
        setGpsStatus({ state: 'verifying', message: 'Verifying location...', distance: null });
        payload = { ...payload, ...coords };
      }

      const record = await api.checkOut(payload);
      const checkOutVal = record?.checkOut || record?.CheckOut || null;
      const checkInVal = record?.checkIn || record?.CheckIn || null;
      const distance = record?.distanceFromOffice ?? record?.DistanceFromOffice ?? null;
      if (checkOutVal) {
        setIsCheckedIn(false);
        setAttendanceSessionCompleted(true);
        setCurrentCheckOutTime(checkOutVal);
        setCurrentCheckInTime(checkInVal || null);
      }
      setGpsStatus({
        state: 'success',
        message: distance !== null ? `Location verified • Distance from office: ${Math.round(distance)} m` : 'Attendance checked out successfully.',
        distance,
      });
      await fetchAttendance();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to check out employee';
      setGpsStatus({ state: 'error', message, distance: null });
      alert(message);
    }
  };

  const handleApplyLeave = async (newLeave) => {
    if (!selectedLeaveEmployeeId) {
      alert('Please select an employee before submitting a leave request.');
      return;
    }

    try {
      await api.submitLeave({
        ...newLeave,
        empId: selectedLeaveEmployeeId,
        empName: newLeave.empName || '',
        department: newLeave.department || '',
        status: 'Pending'
      });
      await fetchLeaves();
      await fetchLeaveBalance();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to submit leave request';
      alert(message);
    }
  };

  const handleApproveLeave = async (id, comments) => {
    if (!id) {
      alert('Leave record is missing a valid backend ID.');
      return;
    }

    try {
      await api.updateLeaveStatus(id, 'Approved', comments);
      await fetchLeaves();
      await fetchLeaveBalance();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to approve leave request';
      alert(message);
    }
  };

  const handleRejectLeave = async (id, comments) => {
    if (!id) {
      alert('Leave record is missing a valid backend ID.');
      return;
    }

    try {
      await api.updateLeaveStatus(id, 'Rejected', comments);
      await fetchLeaves();
      await fetchLeaveBalance();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to reject leave request';
      alert(message);
    }
  };

  const handleRequestShift = async (newShiftReq) => {
    if (!newShiftReq?.empId) {
      alert('Please select an employee before submitting a shift request.');
      return;
    }

    try {
      await api.submitShiftRequest(newShiftReq);
      await fetchShifts();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to submit shift request';
      alert(message);
    }
  };

  const handleApproveShiftRequest = async (shiftId) => {
    if (!shiftId) {
      alert('Shift request is missing a valid backend ID.');
      return;
    }

    try {
      await api.updateShiftStatus(shiftId, 'Approved');
      await fetchShifts();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to approve shift request';
      alert(message);
    }
  };

  const handleRejectShiftRequest = async (shiftId) => {
    if (!shiftId) {
      alert('Shift request is missing a valid backend ID.');
      return;
    }

    try {
      await api.updateShiftStatus(shiftId, 'Rejected');
      await fetchShifts();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to reject shift request';
      alert(message);
    }
  };

  const handleAddTimesheet = async (entry) => {
    if (!entry?.empId) {
      alert('Please select an employee before submitting a timesheet.');
      return;
    }

    const payload = {
      empId: entry.empId,
      date: entry.date,
      projectName: entry.projectName,
      hoursLogged: Number(entry.hoursLogged || 0),
      clientBillingHours: entry.isBillable ? Number(entry.hoursLogged || 0) : 0,
      status: entry.status || 'Submitted'
    };

    try {
      await api.submitTimesheet(payload);
      await fetchTimesheets();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to submit timesheet';
      alert(message);
    }
  };

  const handleApproveTimesheet = async (timesheetId) => {
    if (!timesheetId) {
      alert('Timesheet ID is missing.');
      return;
    }

    try {
      await api.updateTimesheetStatus(timesheetId, 'Approved');
      await fetchTimesheets();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to approve timesheet';
      alert(message);
    }
  };

  const handleRejectTimesheet = async (timesheetId) => {
    if (!timesheetId) {
      alert('Timesheet ID is missing.');
      return;
    }

    try {
      await api.updateTimesheetStatus(timesheetId, 'Rejected');
      await fetchTimesheets();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to reject timesheet';
      alert(message);
    }
  };

  const handleMarkNotificationAsRead = async (id) => {
    if (!id) return;

    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to mark notification as read';
      setNotificationsError(message);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to mark all notifications as read';
      setNotificationsError(message);
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} isLoading={authLoading} authError={authError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navigation */}
      <Navbar
        userRole={userRole}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        unreadCount={unreadNotificationsCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentEmpName={currentEmpName}
        currentEmpId={currentEmpId}
        profile={profile}
        onLogout={handleLogout}
        onRequestChangePassword={() => setShowChangePasswordForm(true)}
        onProfileUpdated={handleProfileUpdated}
      />

      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />

        {/* Main Content Area */}
        {/* Password lifecycle prompt/modal */}
        {showChangePasswordModal && !showChangePasswordForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-lg font-semibold">Your password is the default Employee ID password</h3>
              <p className="mb-4 text-sm text-slate-500">Your account is currently using your Employee ID as the password. You may change it now or continue using the default password.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowChangePasswordModal(false); setShowChangePasswordForm(false); }} className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-700">Keep Default</button>
                <button onClick={() => setShowChangePasswordForm(true)} className="rounded-md bg-indigo-600 px-3 py-1 text-sm text-white">Change Password</button>
              </div>
            </div>
          </div>
        )}

        <ChangePasswordModal
          show={showChangePasswordForm}
          onClose={() => { setShowChangePasswordForm(false); setShowChangePasswordModal(false); }}
          currentPasswordPrefill={lastLoginPassword}
          onPasswordChanged={async () => {
            clearAuthSession();
            setAuthenticatedUser(null);
            setProfile(null);
            setIsAuthenticated(false);
            setShowChangePasswordForm(false);
            setShowChangePasswordModal(false);
            setLastLoginPassword(null);
            setAuthError('Your password has been changed successfully. Please sign in again with your new password.');
            setActiveTab('dashboard');
          }}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && userRole === 'MANAGER' && (
            <ManagerDashboard
              employees={employees}
              attendance={attendance}
              leaves={leaves}
              shifts={shifts}
              timesheets={timesheets}
              profile={profile}
              managerEmpId={currentEmpId}
              managerLoginId={authenticatedUser?.managerLoginId || profile?.managerLoginId || null}
              userRole={userRole}
              dashboardLoading={dashboardLoading}
              dashboardError={dashboardError}
              onNavigate={(tab) => setActiveTab(tab)}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
              onApproveShift={handleApproveShiftRequest}
              onRejectShift={handleRejectShiftRequest}
              onApproveTimesheet={handleApproveTimesheet}
              onRejectTimesheet={handleRejectTimesheet}
            />
          )}

          {activeTab === 'dashboard' && userRole !== 'MANAGER' && (
            <ExecutiveDashboard
              employees={employees}
              attendance={attendance}
              leaves={leaves}
              leaveBalance={leaveBalance}
              payroll={payroll}
              shifts={shifts}
              profile={profile}
              dashboardMetrics={dashboardMetrics}
              dashboardLoading={dashboardLoading}
              dashboardError={dashboardError}
              userRole={userRole}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAIChat={() => setIsAIChatOpen(true)}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManagement
              employees={employees}
              employeesLoading={employeesLoading}
              employeesError={employeesError}
              employeePagination={employeePagination}
              onRequestEmployees={fetchEmployees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceManagement
              attendanceRecords={attendance}
              attendanceLoading={attendanceLoading}
              attendanceError={attendanceError}
              attendancePagination={attendancePagination}
              employees={employees}
              selectedEmployeeId={selectedAttendanceEmployeeId}
              onSelectEmployee={setSelectedAttendanceEmployeeId}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              isCheckedIn={isCheckedIn}
              currentCheckInTime={currentCheckInTime}
              attendanceSessionCompleted={attendanceSessionCompleted}
              currentCheckOutTime={currentCheckOutTime}
              holidays={holidays}
              holidaysLoading={holidaysLoading}
              holidaysError={holidaysError}
              userRole={userRole}
              gpsStatus={gpsStatus}
            />
          )}

          {activeTab === 'leave' && (
            <LeaveManagement
              employees={employees}
              selectedEmployeeId={selectedLeaveEmployeeId}
              onSelectEmployee={setSelectedLeaveEmployeeId}
              leaves={leaves}
              leaveBalance={leaveBalance}
              leaveLoading={leaveLoading}
              leaveError={leaveError}
              onApplyLeave={handleApplyLeave}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
              userRole={userRole}
            />
          )}

          {activeTab === 'shifts' && (
            <ShiftManagement
              employees={employees}
              selectedEmployeeId={selectedShiftEmployeeId || currentEmpId || ''}
              onSelectEmployee={setSelectedShiftEmployeeId}
              shifts={shifts}
              onRequestShift={handleRequestShift}
              onApproveShift={handleApproveShiftRequest}
              onRejectShift={handleRejectShiftRequest}
              userRole={userRole}
              currentEmpId={currentEmpId}
            />
          )}

          {activeTab === 'timesheets' && (
            <TimesheetManagement
              employees={employees}
              selectedEmployeeId={selectedTimesheetEmployeeId}
              onSelectEmployee={setSelectedTimesheetEmployeeId}
              timesheets={timesheets}
              timesheetsLoading={timesheetsLoading}
              timesheetsError={timesheetsError}
              onAddTimesheet={handleAddTimesheet}
              onApproveTimesheet={handleApproveTimesheet}
              onRejectTimesheet={handleRejectTimesheet}
            />
          )}

          {activeTab === 'payroll' && (
            <PayrollManagement
              payrollRecords={payroll}
              payrollLoading={payrollLoading}
              payrollError={payrollError}
              userRole={userRole}
              currentEmpId={currentEmpId}
            />
          )}

          {activeTab === 'ai_planning' && <AIWorkforcePlanning employees={employees} />}

          {activeTab === 'chatbot' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h2 className="text-xl font-bold mb-2">AI Assistant Console</h2>
              <p className="text-xs text-slate-500 mb-4 max-w-md">
                Click the button below or the header pill to open the RAG-enabled conversational assistant.
              </p>
              <button
                onClick={() => setIsAIChatOpen(true)}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30"
              >
                Launch AI Assistant Drawer
              </button>
            </div>
          )}

          {activeTab === 'reports' && <ReportsCenter />}

          {activeTab === 'settings' && <SettingsPage />}

          {activeTab === 'audit' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold mb-1">Audit Trail & Role-Based Access Control (RBAC)</h2>
              <p className="text-xs text-slate-500 mb-4">Security logging and permission auditing</p>

              {auditLogsLoading && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                  Loading audit logs...
                </div>
              )}

              {!auditLogsLoading && auditLogsError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm">
                  Error loading audit logs: {auditLogsError}
                </div>
              )}

              {!auditLogsLoading && !auditLogsError && auditLogs.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  No audit records available.
                </div>
              )}

              {!auditLogsLoading && !auditLogsError && auditLogs.length > 0 && (
                <div className="space-y-2 text-xs font-mono">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded bg-slate-50 dark:bg-slate-800">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold text-slate-800 dark:text-slate-100">[{log.timestamp || 'N/A'}]</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{log.module || 'Unknown Module'}</span>
                        <span className="text-slate-500 dark:text-slate-400">:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{log.action || 'No action'}</span>
                        <span className="ml-auto rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {log.status || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Actor: {log.actor || 'N/A'}</span>
                        <span>ID: {log.id || 'N/A'}</span>
                        <span>IP: {log.ipAddress || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating AI Chatbot Modal */}
      <AIChatbotModal isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} userRole={userRole} currentEmpId={currentEmpId} />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        notificationsLoading={notificationsLoading}
        notificationsError={notificationsError}
        onMarkAsRead={handleMarkNotificationAsRead}
        onClearAll={handleClearAllNotifications}
      />
    </div>
  );
}

export default App;
