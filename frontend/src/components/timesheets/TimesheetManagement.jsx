import React, { useState } from 'react';
import { FileSpreadsheet, Plus, CheckCircle2, Clock, DollarSign } from 'lucide-react';



export const TimesheetManagement = ({
  employees = [],
  selectedEmployeeId = '',
  onSelectEmployee,
  timesheets = [],
  timesheetsLoading = false,
  timesheetsError = null,
  onAddTimesheet,
  onApproveTimesheet,
  onRejectTimesheet
}) => {
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('Enterprise AI Portal Core');
  const [taskDescription, setTaskDescription] = useState('');
  const [hoursLogged, setHoursLogged] = useState(8);
  const [isBillable, setIsBillable] = useState(true);

  const selectedEmployee = employees.find((employee) => employee.empId === selectedEmployeeId) || null;
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
  const totalHours = safeTimesheets.reduce((acc, t) => acc + Number(t?.hoursLogged || 0), 0);
  const billableHours = safeTimesheets
    .filter((t) => Boolean(t?.isBillable) || Number(t?.clientBillingHours || 0) > 0)
    .reduce((acc, t) => acc + Number(t?.hoursLogged || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      alert('Please select an employee before submitting a timesheet.');
      return;
    }

    const newEntry = {
      empId: selectedEmployeeId,
      date: new Date().toISOString().split('T')[0],
      projectName,
      hoursLogged: Number(hoursLogged),
      isBillable,
      status: 'Submitted'
    };

    await onAddTimesheet(newEntry);
    setShowModal(false);
    setTaskDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Daily Timesheets & Client Billing Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Project allocation hours, client billable ratio calculations, and manager sign-off
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Log Time Entry
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500">Total Hours Logged Today</div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalHours} Hours</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500">Client Billable Hours</div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{billableHours} Hours</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500">Billability Ratio</div>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Timesheet List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-white">
          Logged Timesheet Entries
        </h3>

        {timesheetsLoading && (
          <div className="mt-4 text-xs text-slate-500">Loading timesheets...</div>
        )}

        {!timesheetsLoading && timesheetsError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {timesheetsError}
          </div>
        )}

        {!timesheetsLoading && !timesheetsError && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] dark:border-slate-800">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Employee</th>
                  <th className="py-3 px-2">Project</th>
                  <th className="py-3 px-2">Task Deliverable</th>
                  <th className="py-3 px-2">Hours Logged</th>
                  <th className="py-3 px-2">Billable Status</th>
                  <th className="py-3 px-2">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {safeTimesheets.map((t, index) => {
                  const statusText = t.status || 'Pending';
                  const canAct = Boolean(t.id) && !['Approved', 'Rejected'].includes(statusText);

                  return (
                    <tr key={t.id || `${t.empId || 'unknown'}-${t.date || 'date'}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-2 text-slate-500 font-mono">{t.date || 'N/A'}</td>
                      <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{t.empName || t.empId || 'Unknown employee'}</td>
                      <td className="py-3 px-2 font-semibold text-indigo-600 dark:text-indigo-400">{t.projectName || 'Unspecified project'}</td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300 max-w-xs truncate">{t.taskDescription || 'No task description provided'}</td>
                      <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{Number(t.hoursLogged || 0)} hrs</td>
                      <td className="py-3 px-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            Boolean(t.isBillable) || Number(t.clientBillingHours || 0) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {Boolean(t.isBillable) || Number(t.clientBillingHours || 0) > 0 ? 'Client Billable' : 'Internal Non-Billable'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {statusText}
                          </span>
                          {canAct && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApproveTimesheet?.(t.id)}
                                className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => onRejectTimesheet?.(t.id)}
                                className="rounded bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white">
            <h3 className="text-base font-bold border-b border-slate-100 pb-3 dark:border-slate-800">
              Log Project Hours
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
               <label className="font-semibold block mb-1">Employee</label>
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

             <div>
               <label className="font-semibold block mb-1">Project Name</label>
               <input
                 type="text"
                 value={projectName}
                 onChange={(e) => setProjectName(e.target.value)}
                 className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
               />
             </div>

             <div>
               <label className="font-semibold block mb-1">Task Deliverable</label>
               <textarea
                 required
                 rows={2}
                 value={taskDescription}
                 onChange={(e) => setTaskDescription(e.target.value)}
                 placeholder="Describe task progress..."
                 className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
               />
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="font-semibold block mb-1">Hours Logged</label>
                 <input
                   type="number"
                   step="0.5"
                   value={hoursLogged}
                   onChange={(e) => setHoursLogged(Number(e.target.value))}
                   className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                 />
               </div>
               <div className="flex items-center pt-5">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input
                     type="checkbox"
                     checked={isBillable}
                     onChange={(e) => setIsBillable(e.target.checked)}
                     className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                   />
                   <span className="font-semibold text-xs">Is Client Billable?</span>
                 </label>
               </div>
             </div>

             <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
               <button
                 type="button"
                 onClick={() => setShowModal(false)}
                 className="rounded-lg border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
               >
                 Cancel
               </button>
               <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700">
                 Submit Timesheet
               </button>
             </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
