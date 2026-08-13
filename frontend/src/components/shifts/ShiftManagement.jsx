import React, { useState } from 'react';
import { CalendarRange, Clock, CheckCircle2, XCircle, Plus, MessageSquare, AlertCircle } from 'lucide-react';

export const ShiftManagement = ({
  employees = [],
  selectedEmployeeId = '',
  onSelectEmployee,
  shifts,
  onRequestShift,
  onApproveShift,
  onRejectShift,
  userRole
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestedShift, setRequestedShift] = useState('Morning Shift (09:00 - 18:00)');
  const [requestedDate, setRequestedDate] = useState('2026-08-12');
  const [reason, setReason] = useState('');

  const selectedEmployee = employees.find((employee) => employee.empId === selectedEmployeeId) || null;

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      alert('Please select an employee before submitting a shift request.');
      return;
    }

    if (!reason.trim()) return;

    const newReq = {
      empId: selectedEmployeeId,
      requestedShift,
      requestedDate,
      reason: reason.trim(),
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    await onRequestShift(newReq);
    setShowRequestModal(false);
    setReason('');
  };

  const pendingRequests = shifts.filter((s) => s.status === 'Pending');
  const actionedRequests = shifts.filter((s) => s.status !== 'Pending');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Shift Assignment & Employee Shift Requests
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Employees submit shift preference requests with reasons for HR evaluation and approval
          </p>
        </div>

        {userRole === 'EMPLOYEE' && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Submit Shift Request
          </button>
        )}
      </div>

      {/* Shift Slots Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-indigo-700">
          <div className="text-xs font-semibold text-slate-500">Morning Shift (09:00 - 18:00)</div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">164 Active</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">100% Slot Occupancy</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-blue-700">
          <div className="text-xs font-semibold text-slate-500">Evening Shift (14:00 - 23:00)</div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">52 Active</div>
          <div className="mt-1 text-[11px] text-blue-600 font-semibold">Shift Allowance Active</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-purple-700">
          <div className="text-xs font-semibold text-slate-500">Night Shift (22:00 - 07:00)</div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">32 Active</div>
          <div className="mt-1 text-[11px] text-purple-600 font-semibold">+25% Overtime Bonus Rate</div>
        </div>
      </div>

      {/* Pending HR Shift Approval Queue */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Pending Shift Requests ({pendingRequests.length})
            </h3>
            <p className="text-xs text-slate-500">Requests submitted by employees with detailed reasons</p>
          </div>
          <span className="rounded bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            HR Decision Needed
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No pending shift requests at the moment.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.empName}</h4>
                    <span className="text-[11px] text-indigo-600 font-semibold dark:text-indigo-400">
                      {req.department}
                    </span>
                  </div>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Pending HR Review
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Requested Shift</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{req.requestedShift}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Requested Date</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{req.requestedDate}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-white p-2.5 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <span className="font-bold text-slate-500 block text-[10px] uppercase">Reason Provided by Employee:</span>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300 font-medium">{req.reason}</p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => onApproveShift(req.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Shift
                  </button>
                  <button
                    onClick={() => onRejectShift(req.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Shift
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actioned / Approved Shift Allocation History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-white">
          All Shift Request Records & Decisions
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] dark:border-slate-800">
                <th className="py-3 px-2">Employee</th>
                <th className="py-3 px-2">Department</th>
                <th className="py-3 px-2">Requested Shift Slot</th>
                <th className="py-3 px-2">Requested Date</th>
                <th className="py-3 px-2">Reason</th>
                <th className="py-3 px-2">HR Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{s.empName}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{s.department}</td>
                  <td className="py-3 px-2 font-semibold text-indigo-600 dark:text-indigo-400">
                    {s.requestedShift || s.shiftName}
                  </td>
                  <td className="py-3 px-2 text-slate-500">{s.requestedDate || s.assignedDate}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {s.reason || 'Standard operational assignment'}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        s.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : s.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Shift Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white">
            <h3 className="text-base font-bold mb-1">Submit Shift Preference Request</h3>
            <p className="text-xs text-slate-500 mb-4">Provide details and reason for HR evaluation</p>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => onSelectEmployee(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                  required
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => {
                    const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.employeeName || employee.name || employee.empId;
                    return (
                      <option key={employee.empId} value={employee.empId}>
                        {fullName} ({employee.empId})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] dark:border-slate-800 dark:bg-slate-800/60">
                <div className="font-bold text-slate-600 dark:text-slate-300">Selected employee</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {selectedEmployee ? `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim() || selectedEmployee.employeeName || selectedEmployee.name || 'Unknown employee' : 'No employee selected'}
                </div>
                <div className="text-slate-500 dark:text-slate-400">{selectedEmployee ? selectedEmployee.empId : 'Select an employee to continue'}</div>
              </div>

              <div>
                <label className="block font-bold mb-1">Requested Shift Slot</label>
                <select
                  value={requestedShift}
                  onChange={(e) => setRequestedShift(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                >
                  <option value="Morning Shift (09:00 - 18:00)">Morning Shift (09:00 - 18:00)</option>
                  <option value="Evening Shift (14:00 - 23:00)">Evening Shift (14:00 - 23:00)</option>
                  <option value="Night Shift (22:00 - 07:00)">Night Shift (22:00 - 07:00)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Target Date</label>
                <input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Reason for Shift Request</label>
                <textarea
                  rows={3}
                  placeholder="Explain why you are requesting this shift (e.g. medical appointment, exam schedule, childcare)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedEmployeeId}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
