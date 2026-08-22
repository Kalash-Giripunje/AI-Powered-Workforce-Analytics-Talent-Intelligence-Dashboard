import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Search,
  ShieldCheck
} from 'lucide-react';

export const AttendanceManagement = ({
  attendanceRecords,
  attendanceLoading = false,
  attendanceError = null,
  attendancePagination = null,
  employees = [],
  selectedEmployeeId,
  onCheckIn,
  onCheckOut,
  isCheckedIn,
  attendanceSessionCompleted = false,
  holidays = [],
  holidaysLoading = false,
  holidaysError = null,
  userRole = 'HR_ADMIN',
  gpsStatus = { state: 'idle', message: 'Location check will run before attendance is recorded.', distance: null }
}) => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // local UI animation flags for subtle success pulse
  const [animateCheckIn, setAnimateCheckIn] = useState(false);
  const [animateCheckOut, setAnimateCheckOut] = useState(false);
  const prevCheckedRef = React.useRef(isCheckedIn);

  React.useEffect(() => {
    // detect check-in transition (false -> true)
    if (!prevCheckedRef.current && isCheckedIn) {
      setAnimateCheckIn(true);
      setTimeout(() => setAnimateCheckIn(false), 800);
    }
    // detect check-out transition: was checked in and now session completed
    if (prevCheckedRef.current && !isCheckedIn && attendanceSessionCompleted) {
      setAnimateCheckOut(true);
      setTimeout(() => setAnimateCheckOut(false), 800);
    }
    prevCheckedRef.current = isCheckedIn;
  }, [isCheckedIn, attendanceSessionCompleted]);

  // derive some HR-facing aggregates (today/date-aware)
  const todayISO = new Date().toISOString().slice(0, 10);

  const attByEmpToday = (attendanceRecords || []).reduce((acc, r) => {
    const recDate = (r.date || r.Date || '').toString().slice(0, 10);
    if (recDate === todayISO) {
      acc[r.empId] = acc[r.empId] || [];
      acc[r.empId].push(r);
    }
    return acc;
  }, {});

  // Use attendance API pagination total for the KPI total when available.
  const apiTotal = (attendancePagination && typeof attendancePagination.total === 'number') ? attendancePagination.total : null;
  const activeEmployeesCount = apiTotal !== null
    ? apiTotal
    : (employees || []).filter((e) => {
      const s = (e.status || e.EmploymentStatus || '').toString().toLowerCase();
      return s === 'active';
    }).length;

  const currentlyWorkingCount = Object.values(attByEmpToday).flat().filter((r) => (r.checkIn || r.CheckIn) && !(r.checkOut || r.CheckOut)).length;
  const checkedOutCount = Object.values(attByEmpToday).flat().filter((r) => (r.checkIn || r.CheckIn) && (r.checkOut || r.CheckOut)).length;
  const presentCount = currentlyWorkingCount + checkedOutCount;
  const absentCount = Math.max(0, activeEmployeesCount - presentCount);

  const lateCount = Object.values(attByEmpToday).flat().filter((r) => r.LateArrival === true || (r.status && r.status.toString().toLowerCase() === 'late')).length;

  const q = (searchQuery || '').toLowerCase();
  const filteredLogs = (attendanceRecords || []).filter((rec) => {
    const matchesStatus = filterStatus === 'ALL' || rec.status === filterStatus;
    const name = (rec.empName || '').toString();
    const dept = (rec.department || '').toString();
    const matchesSearch = name.toLowerCase().includes(q) || dept.toLowerCase().includes(q) || (rec.empId || '').toString().toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const anomalyCount = (attendanceRecords || []).filter((r) => {
    if (!r || !r.isAnomaly) return false;
    if (userRole !== 'HR_ADMIN' && userRole !== 'MANAGER') {
      const rid = r?.empId || r?.EmpID || r?.EmpId || r?.employeeId || null;
      return rid && String(rid) === String(selectedEmployeeId);
    }
    return true;
  }).length;

  const selectedEmployeeRecord = (attendanceRecords || []).find((record) => {
    const normalizedEmpId = record?.empId || record?.EmpID || record?.EmpId || record?.employeeId;
    return normalizedEmpId === selectedEmployeeId && (record?.date || record?.Date) === todayISO;
  }) || null;

  const employeeStatus = !selectedEmployeeRecord
    ? 'Not Checked In'
    : ((selectedEmployeeRecord.checkIn || selectedEmployeeRecord.CheckIn) && !(selectedEmployeeRecord.checkOut || selectedEmployeeRecord.CheckOut))
      ? 'Currently Working'
      : 'Day Completed';

  const employeeDisplayName = (() => {
    const current = (employees || []).find((emp) => (emp.empId || emp.EmpID || emp.EmpId) === selectedEmployeeId);
    if (!current) return 'Employee';
    const name = `${current.firstName || ''} ${current.lastName || ''}`.trim();
    return name || current.empId || 'Employee';
  })();

  const checkInValue = selectedEmployeeRecord ? (selectedEmployeeRecord.checkIn || selectedEmployeeRecord.CheckIn || '—') : '—';
  const checkOutValue = selectedEmployeeRecord ? (selectedEmployeeRecord.checkOut || selectedEmployeeRecord.CheckOut || '—') : '—';
  const workingHoursValue = selectedEmployeeRecord ? (selectedEmployeeRecord.workingHours ?? selectedEmployeeRecord.WorkingHours ?? '0.00') : '0.00';

  const statusClassMap = {
    'Not Checked In': 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
    'Currently Working': 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-800',
    'Day Completed': 'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:ring-sky-800'
  };

  const entrySubtitle =
    employeeStatus === 'Not Checked In'
      ? 'Start your workday'
      : employeeStatus === 'Currently Working'
        ? 'End your workday'
        : "Today's attendance is complete";

  const timelineItems = [
    {
      label: 'Check In',
      value: checkInValue,
      helper: checkInValue === '—' ? 'Not started yet' : 'Workday started'
    },
    {
      label: 'Check Out',
      value: checkOutValue,
      helper: checkOutValue === '—' ? 'Not completed yet' : 'Workday completed'
    }
  ];

  return (
    <div className="space-y-6">
      {attendanceError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          Error loading attendance: {attendanceError}
        </div>
      )}
      {attendanceLoading && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
          Loading attendance...
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {userRole === 'HR_ADMIN' ? 'Attendance & Workforce Monitoring' : userRole === 'MANAGER' ? 'Team Attendance' : 'Attendance'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {userRole === 'HR_ADMIN' ? "Today's workforce overview and attendance trends" : userRole === 'MANAGER' ? 'Track attendance for your team members' : 'Track your workday attendance'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Attendance Service
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {userRole === 'EMPLOYEE' ? (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-500 ${
                animateCheckIn || animateCheckOut ? 'border-emerald-200 bg-emerald-50/70' : ''
              } dark:border-slate-800 dark:bg-slate-900`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Attendance</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClassMap[employeeStatus] || 'bg-slate-100 text-slate-700'}`}>
                  {employeeStatus}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-slate-700">
                      {(employeeDisplayName || 'E').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-slate-900 dark:text-white">{employeeDisplayName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{selectedEmployeeId || 'Employee ID unavailable'}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Check In</div>
                    <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{checkInValue}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Check Out</div>
                    <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{checkOutValue}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Working Hours</div>
                    <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{employeeStatus === 'Day Completed' ? `${workingHoursValue} hrs` : 'In progress'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {employeeStatus === 'Not Checked In' && 'Ready to start your workday'}
                  {employeeStatus === 'Currently Working' && `Checked in at ${checkInValue}`}
                  {employeeStatus === 'Day Completed' && `Checked in: ${checkInValue} • Checked out: ${checkOutValue}`}
                </div>

                {employeeStatus === 'Day Completed' ? (
                  <button
                    disabled
                    className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  >
                    ✓ Checked Out
                  </button>
                ) : (
                  <button
                    onClick={employeeStatus === 'Currently Working' ? onCheckOut : onCheckIn}
                    className={`rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-all ${
                      employeeStatus === 'Currently Working'
                        ? 'bg-rose-500 text-white shadow-sm hover:bg-rose-600'
                        : 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                    } ${animateCheckIn || animateCheckOut ? 'scale-[1.01]' : ''}`}
                  >
                    {employeeStatus === 'Currently Working' ? 'Check Out' : 'Check In'}
                  </button>
                )}
              </div>

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{entrySubtitle}</div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Location Verification</div>
                <div className={`text-sm ${gpsStatus.state === 'error' ? 'text-rose-600' : gpsStatus.state === 'success' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-200'}`}>
                  {gpsStatus.state === 'requesting' && 'Requesting location...'}
                  {gpsStatus.state === 'verifying' && 'Verifying location...'}
                  {gpsStatus.state === 'success' && (
                    <>
                      <span className="font-semibold">✓ Attendance Verified</span>
                      {gpsStatus.distance !== null && (
                        <span className="ml-2 text-slate-600 dark:text-slate-300">Distance from office: {Math.round(gpsStatus.distance)} m</span>
                      )}
                    </>
                  )}
                  {gpsStatus.state === 'error' && (
                    <span className="font-semibold">⚠ {gpsStatus.message}</span>
                  )}
                  {gpsStatus.state === 'idle' && gpsStatus.message}
                </div>
                {gpsStatus.state !== 'idle' && gpsStatus.message && gpsStatus.state !== 'error' && gpsStatus.state !== 'success' && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{gpsStatus.message}</div>
                )}
                {gpsStatus.state === 'success' && gpsStatus.message && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{gpsStatus.message}</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Today's Timeline</div>
              <div className="space-y-3">
                {timelineItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="mt-1 flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/60">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{item.label}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{item.value}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.helper}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Attendance Overview</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Today's Workforce</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Server-verified attendance</span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-center dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Total</div>
                <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">{activeEmployeesCount}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-center dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Working</div>
                <div className="mt-1 text-xl font-black text-emerald-600">{currentlyWorkingCount}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-center dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Checked Out</div>
                <div className="mt-1 text-xl font-black text-sky-600">{checkedOutCount}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-center dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Absent</div>
                <div className="mt-1 text-xl font-black text-rose-600">{absentCount}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-center dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Late</div>
                <div className="mt-1 text-xl font-black text-amber-600">{lateCount}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Today</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-950/60 dark:text-white"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-950/60 dark:text-white"
                  >
                    <option value="ALL">All</option>
                    <option value="WORKING">Working</option>
                    <option value="CHECKED_OUT">Checked Out</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Employee</th>
                      <th className="px-3 py-2 font-semibold">Department</th>
                      <th className="px-3 py-2 font-semibold">Check In</th>
                      <th className="px-3 py-2 font-semibold">Check Out</th>
                      <th className="px-3 py-2 font-semibold">Hours</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(employees || []).filter((emp) => {
                      const s = (emp.status || emp.EmploymentStatus || '').toString().toLowerCase();
                      if (s !== 'active') return false;
                      const ql = (searchQuery || '').toLowerCase();
                      if (!ql) return true;
                      const haystack = `${emp.empId || ''} ${emp.firstName || ''} ${emp.lastName || ''} ${emp.department || ''}`.toLowerCase();
                      return haystack.includes(ql);
                    }).slice(0, 100).map((emp) => {
                      const rec = (attByEmpToday[emp.empId] || [])[0] || null;
                      const hasCheckIn = !!(rec && (rec.checkIn || rec.CheckIn));
                      const hasCheckOut = !!(rec && (rec.checkOut || rec.CheckOut));
                      const rowStatus = rec && hasCheckIn && rec.LateArrival === true ? 'LATE' : rec && hasCheckIn && !hasCheckOut ? 'WORKING' : rec && hasCheckIn && hasCheckOut ? 'CHECKED OUT' : 'ABSENT';
                      if (filterStatus !== 'ALL' && rowStatus !== filterStatus) return null;

                      return (
                        <tr key={emp.empId} className="border-t border-slate-200 dark:border-slate-800">
                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-900 dark:text-white">{emp.firstName || ''} {emp.lastName || ''}</div>
                            <div className="text-[10px] text-slate-500">{emp.empId}</div>
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{emp.department || emp.Department || '—'}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{rec ? (rec.checkIn || rec.CheckIn || '—') : '—'}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{rec ? (rec.checkOut || rec.CheckOut || '—') : '—'}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{rec ? ((rec.workingHours ?? rec.WorkingHours) ?? '—') : '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${
                              rowStatus === 'WORKING' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                              rowStatus === 'CHECKED OUT' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' :
                              rowStatus === 'LATE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {rowStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Anomalies</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">{anomalyCount}</span>
            </div>

            <div className="mt-3 space-y-2">
            {(attendanceRecords || []).filter((r) => {
              if (!r || !r.isAnomaly) return false;
              if (userRole !== 'HR_ADMIN') {
                const rid = r?.empId || r?.EmpID || r?.EmpId || r?.employeeId || null;
                return rid && String(rid) === String(selectedEmployeeId);
              }
              return true;
            }).slice(0, 3).map((rec, idx) => (
              <div key={rec?.id || `${rec?.empId || 'unknown'}-${idx}`} className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{rec.empName || '?'}</span>
                  <span className="text-[10px] uppercase tracking-[0.12em]">{rec.status || '?'}</span>
                </div>
                <div className="mt-1 text-[10px] opacity-80">{rec.anomalyReason || 'Attendance anomaly detected'}</div>
              </div>
            ))}
            {anomalyCount === 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">No attendance anomalies detected.</div>
            )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{new Date().toLocaleDateString('en-US', { month: 'long' })} Holidays</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{holidaysLoading ? 'Loading...' : holidaysError ? 'Unable to load holidays' : `${holidays.length || 0} public holiday${(holidays.length || 0) === 1 ? '' : 's'}`}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {(!holidays || holidays.length === 0) ? (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">No public holidays this month.</div>
              ) : (
                holidays.slice(0, 2).map((h, idx) => {
                  const dateObj = new Date(h.date);
                  const dayLabel = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                  return (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{dayLabel}</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-white">{h.name}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Logs Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-200 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-indigo-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Attendance Log</h3>
            <p className="text-xs text-slate-500">Real-time attendance events and location coordinates</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter employee name..."
                className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] dark:border-slate-800">
                <th className="py-3 px-2">Employee</th>
                <th className="py-3 px-2">Department</th>
                <th className="py-3 px-2">Check-in</th>
                <th className="py-3 px-2">Check-out</th>
                <th className="py-3 px-2">Hours</th>
                <th className="py-3 px-2">Details</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log, idx) => {
                const rowKey = log?.id || `${log?.empId || 'unknown'}-${idx}`;
                const avatarSrc = log?.avatar && typeof log.avatar === 'string' && log.avatar.trim() !== '' ? log.avatar : null;
                return (
                <tr key={rowKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-2 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={log?.empName || ''} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">{log?.empName?.[0] || (log?.empId ? String(log.empId).slice(-2) : '—')}</div>
                    )}
                    {log.empName || '—' }
                  </td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{log.department}</td>
                  <td className="py-3 px-2 font-mono text-slate-800 dark:text-slate-200">{log.checkIn}</td>
                  <td className="py-3 px-2 font-mono text-slate-800 dark:text-slate-200">{log.checkOut}</td>
                  <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">{log.workingHours} hrs</td>
                  <td className="py-3 px-2 text-slate-500 font-medium">{log.status === 'Late' ? 'Late arrival' : log.status === 'Present' ? 'Attendance recorded' : log.status === 'Absent' ? 'No attendance logged' : 'Server-verified attendance'}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        log.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : log.status === 'Late'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
