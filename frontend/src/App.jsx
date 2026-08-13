import React, { useState, useEffect } from 'react';
import {
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_PERFORMANCE,
  INITIAL_LEAVE_BALANCE
} from './data/mockData';

import { api } from './services/api';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Views
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
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

export function App() {
  const [userRole, setUserRole] = useState('HR_ADMIN');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRoleChange = (role) => {
    setUserRole(role);
    if (role === 'EMPLOYEE') {
      const allowedEmployeeTabs = ['attendance', 'leave', 'shifts', 'payroll'];
      if (!allowedEmployeeTabs.includes(activeTab)) {
        setActiveTab('attendance');
      }
    }
  };

  // Domain States
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [selectedAttendanceEmployeeId, setSelectedAttendanceEmployeeId] = useState('');
  const [selectedLeaveEmployeeId, setSelectedLeaveEmployeeId] = useState('');
  const [selectedShiftEmployeeId, setSelectedShiftEmployeeId] = useState('');
  const [selectedTimesheetEmployeeId, setSelectedTimesheetEmployeeId] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
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
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState({
    casualLeave: { total: 0, used: 0, remaining: 0 },
    sickLeave: { total: 0, used: 0, remaining: 0 },
    earnedLeave: { total: 0, used: 0, remaining: 0 },
    parentalLeave: { total: 0, used: 0, remaining: 0 }
  });

  // Punch State
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [currentCheckInTime, setCurrentCheckInTime] = useState('08:52 AM');

  // Overlays
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchNotifications();
    fetchProfile();
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile() {
    try {
      const data = await api.getProfile();
      setProfile(data || null);
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
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEmployees(params = {}) {
    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      const resp = await api.getEmployees(params);
      const items = resp && resp.items ? resp.items : [];
      setEmployees(items);
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
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAttendance(params = {}) {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const resp = await api.getAttendance(params);
      const items = resp && resp.items ? resp.items : [];
      setAttendance(items);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load attendance';
      setAttendanceError(message);
    } finally {
      setAttendanceLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaves();
    fetchLeaveBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchLeaves(params = {}) {
    setLeaveLoading(true);
    setLeaveError(null);
    try {
      const resp = await api.getLeaves(params);
      const items = Array.isArray(resp) ? resp : [];
      setLeaves(items);
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
    fetchShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    fetchTimesheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    fetchPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPayroll(params = {}) {
    setPayrollLoading(true);
    setPayrollError(null);
    try {
      const resp = await api.getPayroll(params);
      const items = Array.isArray(resp) ? resp : [];
      setPayroll(items);
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

  const handleCheckIn = async (method) => {
    if (!selectedAttendanceEmployeeId) {
      alert('Please select an employee before checking in.');
      return;
    }

    try {
      await api.checkIn({ empId: selectedAttendanceEmployeeId });
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setIsCheckedIn(true);
      setCurrentCheckInTime(time);
      await fetchAttendance();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to check in employee';
      alert(message);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedAttendanceEmployeeId) {
      alert('Please select an employee before checking out.');
      return;
    }

    try {
      await api.checkOut({ empId: selectedAttendanceEmployeeId });
      setIsCheckedIn(false);
      setCurrentCheckInTime(null);
      await fetchAttendance();
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Failed to check out employee';
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navigation */}
      <Navbar
        userRole={userRole}
        setUserRole={handleRoleChange}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        unreadCount={unreadNotificationsCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentEmpName={profile?.name || 'User'}
      />

      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              employees={employees}
              attendance={attendance}
              leaves={leaves}
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
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceManagement
              attendanceRecords={attendance}
              attendanceLoading={attendanceLoading}
              attendanceError={attendanceError}
              employees={employees}
              selectedEmployeeId={selectedAttendanceEmployeeId}
              onSelectEmployee={setSelectedAttendanceEmployeeId}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              isCheckedIn={isCheckedIn}
              currentCheckInTime={currentCheckInTime}
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
              selectedEmployeeId={selectedShiftEmployeeId}
              onSelectEmployee={setSelectedShiftEmployeeId}
              shifts={shifts}
              onRequestShift={handleRequestShift}
              onApproveShift={handleApproveShiftRequest}
              onRejectShift={handleRejectShiftRequest}
              userRole={userRole}
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
      <AIChatbotModal isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />

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
