import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Plus,
  X
} from 'lucide-react';

export const LeaveManagement = ({
  employees = [],
  selectedEmployeeId,
  onSelectEmployee,
  leaves = [],
  leaveBalance,
  leaveLoading = false,
  leaveError = null,
  onApplyLeave,
  onApproveLeave,
  onRejectLeave,
  userRole
}) => {
  const [selectedTab, setSelectedTab] = useState('PENDING'); // PENDING or HISTORY
  const [expandedLeaveId, setExpandedLeaveId] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Form State
  const [applicantName, setApplicantName] = useState('');
  const [department, setDepartment] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('2026-08-10');
  const [endDate, setEndDate] = useState('2026-08-12');
  const [reason, setReason] = useState('');

  const selectedEmployee = (employees || []).find((emp) => emp.empId === selectedEmployeeId) || null;

  const syncSelectedEmployeeDetails = () => {
    if (selectedEmployee) {
      setApplicantName(`${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim() || selectedEmployee.empId || '');
      setDepartment(selectedEmployee.department || '');
    }
  };

  React.useEffect(() => {
    syncSelectedEmployeeDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, employees]);

  const safeLeaveBalance = leaveBalance || {
    casualLeave: { total: 0, used: 0, remaining: 0 },
    sickLeave: { total: 0, used: 0, remaining: 0 },
    earnedLeave: { total: 0, used: 0, remaining: 0 },
    parentalLeave: { total: 0, used: 0, remaining: 0 }
  };

  const safeLeaves = (userRole === 'HR_ADMIN' || userRole === 'MANAGER') ? (leaves || []) : (leaves || []).filter((l) => {
    const lid = l?.empId || l?.EmpID || l?.EmpId || l?.employeeId || null;
    return lid && String(lid) === String(selectedEmployeeId);
  });
  const pendingLeaves = (safeLeaves || []).filter((l) => l.status === 'Pending');
  const historyLeaves = (safeLeaves || []).filter((l) => l.status !== 'Pending');

  const toggleExpand = (id) => {
    setExpandedLeaveId(expandedLeaveId === id ? null : id);
  };

  const handleCommentChange = (id, text) => {
    setCommentInput((prev) => ({ ...prev, [id]: text }));
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    if (!selectedEmployeeId) {
      alert('Please select an employee before submitting a leave request.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave = {
      id: null,
      empName: applicantName || `${selectedEmployee?.firstName || ''} ${selectedEmployee?.lastName || ''}`.trim() || selectedEmployeeId,
      empId: selectedEmployeeId,
      department: department || selectedEmployee?.department || '',
      leaveType,
      startDate,
      endDate,
      days: days || 1,
      reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    if (onApplyLeave) {
      onApplyLeave(newLeave);
    }
    setShowApplyModal(false);
    setReason('');
  };

  const currentLeaves = selectedTab === 'PENDING' ? pendingLeaves : historyLeaves;

  return (
    <div className="space-y-6">
      {leaveError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm">
          Error loading leave data: {leaveError}
        </div>
      )}
      {leaveLoading && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800 text-sm">
          Loading leave data...
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Leave Applications & Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Apply for time off, evaluate leave balances, and review approval history
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === 'EMPLOYEE' && (
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Apply for Leave
            </button>
          )}
          <span className="rounded-md bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {pendingLeaves.length} Pending
          </span>
        </div>
      </div>

      {/* Leave Balance Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-indigo-700">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Casual Leave (CL)</span>
            <span className="font-bold text-indigo-600">{safeLeaveBalance.casualLeave.remaining} Left</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {safeLeaveBalance.casualLeave.remaining} <span className="text-xs font-medium text-slate-400">/ {safeLeaveBalance.casualLeave.total} Days</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              style={{ width: `${((safeLeaveBalance.casualLeave.remaining || 0) / Math.max((safeLeaveBalance.casualLeave.total || 0), 1)) * 100}%` }}
              className="h-full bg-indigo-600"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-emerald-700">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Sick Leave (SL)</span>
            <span className="font-bold text-emerald-600">{safeLeaveBalance.sickLeave.remaining} Left</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {safeLeaveBalance.sickLeave.remaining} <span className="text-xs font-medium text-slate-400">/ {safeLeaveBalance.sickLeave.total} Days</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              style={{ width: `${((safeLeaveBalance.sickLeave.remaining || 0) / Math.max((safeLeaveBalance.sickLeave.total || 0), 1)) * 100}%` }}
              className="h-full bg-emerald-600"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-purple-700">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Earned / Privilege Leave</span>
            <span className="font-bold text-purple-600">{safeLeaveBalance.earnedLeave.remaining} Left</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {safeLeaveBalance.earnedLeave.remaining} <span className="text-xs font-medium text-slate-400">/ {safeLeaveBalance.earnedLeave.total} Days</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              style={{ width: `${((safeLeaveBalance.earnedLeave.remaining || 0) / Math.max((safeLeaveBalance.earnedLeave.total || 0), 1)) * 100}%` }}
              className="h-full bg-purple-600"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-blue-700">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Parental Leave</span>
            <span className="font-bold text-blue-600">{safeLeaveBalance.parentalLeave.remaining} Left</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {safeLeaveBalance.parentalLeave.remaining} <span className="text-xs font-medium text-slate-400">/ {safeLeaveBalance.parentalLeave.total} Days</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              style={{ width: `${((safeLeaveBalance.parentalLeave.remaining || 0) / Math.max((safeLeaveBalance.parentalLeave.total || 0), 1)) * 100}%` }}
              className="h-full bg-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Divided View Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSelectedTab('PENDING')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
            selectedTab === 'PENDING'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Applications ({pendingLeaves.length})
        </button>

        <button
          onClick={() => setSelectedTab('HISTORY')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
            selectedTab === 'HISTORY'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Approved & Decision History ({historyLeaves.length})
        </button>
      </div>

      {/* Cards View */}
      {currentLeaves.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-semibold">No leave applications found in this section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {currentLeaves.map((leave, idx) => {
            const isExpanded = expandedLeaveId === (leave.id || `${leave.empId || 'unknown'}-${idx}`);
            const rowKey = leave.id || `${leave.empId || 'unknown'}-${idx}`;
            // Defensive empName handling - some records may have null/undefined empName
            const displayName = typeof leave.empName === 'string' && leave.empName.trim() !== ''
              ? leave.empName
              : (leave.empId || 'N/A');

            // Compute initials safely
            const initials = (typeof displayName === 'string' && displayName)
              ? displayName.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0,2)
              : (leave.empId ? String(leave.empId).slice(-2) : 'NA');

            return (
              <div
                key={rowKey}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Person Header (Clicking opens details) */}
                <div
                  onClick={() => toggleExpand(rowKey)}
                  className="flex cursor-pointer items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold dark:bg-indigo-950 dark:text-indigo-300">
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {displayName}
                        <span className="text-[10px] text-indigo-600 font-semibold dark:text-indigo-400">
                          ({leave.empId})
                        </span>
                      </h3>
                      <div className="text-xs text-slate-500">{leave.department || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        leave.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : leave.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {leave.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Card Summary Bar */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Leave Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{leave.leaveType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Duration</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {leave.startDate} → {leave.endDate} ({leave.days} days)
                    </span>
                  </div>
                </div>

                {/* Expanded Details Section (Opens when person name/card clicked) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 dark:border-slate-800">
                    <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Reason for Leave Request:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {leave.reason}
                      </p>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Applied Date: {leave.appliedOn || '2026-08-01'}</span>
                      <span>Request ID: {leave.id || 'N/A'}</span>
                    </div>

                    {leave.status === 'Pending' && (
                      <div className="space-y-2 pt-2">
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Add manager comments or approval remarks..."
                            value={commentInput[rowKey] || ''}
                            onChange={(e) => handleCommentChange(rowKey, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() =>
                              onApproveLeave(
                                leave.id,
                                commentInput[rowKey] || 'Approved by HR Manager'
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve Request
                          </button>

                          <button
                            onClick={() =>
                              onRejectLeave(
                                leave.id,
                                commentInput[rowKey] || 'Rejected due to coverage constraints'
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject Request
                          </button>
                        </div>
                      </div>
                    )}

                    {leave.status !== 'Pending' && leave.approverComments && (
                      <div className="rounded-lg bg-slate-100 p-2 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <span className="font-bold">Remarks:</span> {leave.approverComments}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Apply for Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Submit New Leave Application
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Employee
                </label>
                <select
                  value={selectedEmployeeId || ''}
                  onChange={(e) => onSelectEmployee?.(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  required
                >
                  <option value="">Select employee...</option>
                  {(employees || []).map((employee) => (
                    <option key={employee.empId} value={employee.empId}>
                      {`${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.empId} ({employee.empId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Casual Leave">Casual Leave (CL)</option>
                    <option value="Sick Leave">Sick Leave (SL)</option>
                    <option value="Privilege Leave">Privilege Leave (PL)</option>
                    <option value="Parental Leave">Parental Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Leave Application
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the purpose or reason for requesting time off..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
