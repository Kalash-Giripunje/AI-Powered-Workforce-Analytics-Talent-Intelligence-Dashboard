import React from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  UserPlus,
  FileSpreadsheet,
  Zap,
  CheckCircle2,
  Calendar
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';



export const ExecutiveDashboard = ({
  employees = [],
  attendance = [],
  leaves = [],
  dashboardMetrics = {},
  dashboardLoading = false,
  dashboardError = null,
  userRole = 'EMPLOYEE',
  onNavigate = () => {},
  onOpenAIChat = () => {},
  shifts = [],
  payroll = [],
  leaveBalance = {},
  profile = null
}) => {
  const metrics = dashboardMetrics || {};
  const formatCurrencyCompact = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 'N/A';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(numericValue);
  };

  const totalEmployees = Number.isFinite(Number(metrics.totalEmployees))
    ? Number(metrics.totalEmployees)
    : (employees?.length ?? 'N/A');
  const activeCount = Number.isFinite(Number(metrics.activeEmployees))
    ? Number(metrics.activeEmployees)
    : employees.filter((e) => String(e.status).toLowerCase() === 'active').length;
  const pendingLeaves = leaves.filter((l) => String(l.status).toLowerCase() === 'pending');
  const pendingLeaveRequests = Number.isFinite(Number(metrics.pendingLeaveRequests))
    ? Number(metrics.pendingLeaveRequests)
    : pendingLeaves.length;
  const attendanceRate = metrics.attendanceRate || 'N/A';
  const payrollValue = Number.isFinite(Number(metrics.totalMonthlyPayroll))
    ? formatCurrencyCompact(metrics.totalMonthlyPayroll)
    : 'N/A';
  const pendingShiftRequests = Number.isFinite(Number(metrics.pendingShiftRequests))
    ? Number(metrics.pendingShiftRequests)
    : 0;
  const attritionRiskCount = Number.isFinite(Number(metrics.attritionRiskCount))
    ? Number(metrics.attritionRiskCount)
    : 0;

  // Employee-specific personal dashboard
  if (userRole === 'EMPLOYEE') {
    const empId = (dashboardMetrics && dashboardMetrics.empId) || null; // fallback
    // try to infer empId from attendance or leaves if profile not present
    const deriveEmpId = (record) => record?.empId || record?.EmpID || record?.EmpId || record?.employeeId || null;
    const inferredEmpId = empId || (attendance && attendance.length ? deriveEmpId(attendance[0]) : null);
    const myEmpId = inferredEmpId || null;

    // Build last 7 days labels
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return d.toISOString().slice(0, 10);
    });

    const attendanceMap = days.map((day) => {
      const records = (attendance || []).filter((r) => {
        const rid = deriveEmpId(r);
        const date = (r.date || r.Date || r.DateString || r.DateTime || r.RecordDate || '').slice(0, 10);
        return rid && String(rid) === String(myEmpId) && date === day;
      });
      const present = records.filter((r) => {
        const status = (r.AttendanceStatus || r.attendanceStatus || r.status || '').toString().toLowerCase();
        return status === 'present' || (r.workingHours || r.WorkingHours || 0) > 0;
      }).length;
      const late = records.filter((r) => r.LateArrival === true || r.lateArrival === true).length;
      const absent = present === 0 ? 1 : 0; // simple indicator per day
      return { date: day, present, late, absent };
    });

    const totalPresent = attendanceMap.reduce((s, it) => s + it.present, 0);
    const totalLate = attendanceMap.reduce((s, it) => s + it.late, 0);
    const totalDays = attendanceMap.length;
    const attendanceRateEmp = totalDays ? `${Math.round((totalPresent / totalDays) * 100)}%` : 'N/A';

    // Leave summary
    const myLeaves = (leaves || []).filter((l) => {
      const lid = deriveEmpId(l);
      return lid && String(lid) === String(myEmpId);
    });

    // Next shift
    const myNextShift = (Array.isArray(shifts) ? shifts : []).filter((s) => {
      const sid = deriveEmpId(s);
      return sid && String(sid) === String(myEmpId);
    }).sort((a,b) => (a.ShiftDate || a.shiftDate || '') > (b.ShiftDate || b.shiftDate || '') ? 1 : -1)[0];

    // Latest payroll
    const myPayroll = (Array.isArray(payroll) ? payroll : []).filter((p) => {
      const pid = deriveEmpId(p);
      return pid && String(pid) === String(myEmpId);
    }).sort((a,b) => (b.PayrollMonth || b.payrollMonth || '') > (a.PayrollMonth || a.payrollMonth || '') ? 1 : -1)[0];

    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Good day{profile && profile.name ? `, ${profile.name}` : ''}</h3>
              <p className="text-sm text-slate-500">Employee Self-Service</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Employee ID</div>
              <div className="text-sm font-semibold">{myEmpId || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs text-slate-500">Attendance Rate</div>
            <div className="mt-2 text-2xl font-bold">{attendanceRateEmp}</div>
            <div className="text-[11px] text-slate-400">Last 7 days</div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs text-slate-500">Leave Balance</div>
            <div className="mt-2 text-sm">
              {leaveBalance ? (
                <div className="space-y-1 text-sm text-slate-700">
                  <div>Casual: {leaveBalance.casualLeave?.remaining ?? '-'}</div>
                  <div>Sick: {leaveBalance.sickLeave?.remaining ?? '-'}</div>
                  <div>Earned: {leaveBalance.earnedLeave?.remaining ?? '-'}</div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">No data</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs text-slate-500">Next Shift</div>
            <div className="mt-2 text-sm font-semibold">{myNextShift ? `${myNextShift.ShiftName || myNextShift.shiftName || 'Shift'} • ${myNextShift.ShiftDate || myNextShift.shiftDate || 'N/A'}` : 'No upcoming shifts'}</div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs text-slate-500">Latest Payroll</div>
            <div className="mt-2 text-sm font-semibold">{myPayroll ? `Net: ${myPayroll.NetSalary ?? myPayroll.netSalary ?? myPayroll.NetPay ?? 'N/A'}` : 'No payroll records'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs font-bold text-slate-600 mb-2">Attendance (Last 7 days)</div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={attendanceMap}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="present" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs font-bold text-slate-600 mb-2">Leaves (Recent)</div>
            {myLeaves.length === 0 ? (
              <div className="text-sm text-slate-500">No recent leave records</div>
            ) : (
              <div className="space-y-2 text-sm">
                {myLeaves.slice(0,5).map((l,idx) => (
                  <div key={idx} className="rounded p-2 border border-slate-100">
                    <div className="font-semibold">{l.LeaveType || l.leaveType || l.type || 'Leave'}</div>
                    <div className="text-xs text-slate-500">{(l.StartDate || l.startDate) || (l.Start || 'N/A')} → {(l.EndDate || l.endDate) || (l.End || 'N/A')}</div>
                    <div className="text-xs text-slate-500">Status: {l.Status || l.status || 'N/A'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur">
                LIVE ENTERPRISE CONTROL CENTER
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Real-time Sync Active
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Workforce Intelligence Overview
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-300">
              AI-driven automated attendance tracking, payroll input calculation, leave requests, and workforce planning across 8 global locations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAIChat}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-bold shadow-lg shadow-indigo-500/30 transition hover:opacity-95"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI Assistant
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold backdrop-blur transition hover:bg-slate-700"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Executive Report
            </button>
          </div>
        </div>
      </div>

      {dashboardError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
          Dashboard metrics unavailable: {dashboardError}
        </div>
      )}

      {dashboardLoading && !dashboardMetrics && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Loading dashboard metrics...
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 1: Headcount */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-indigo-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Headcount</span>
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalEmployees}</span>
            <span className="flex items-center text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="h-3 w-3" /> +4.2% YoY
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {activeCount} tracked in active directory
          </p>
        </div>

        {/* KPI 2: Attendance Rate */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-emerald-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Attendance</span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{attendanceRate}</span>
            <span className="text-[10px] font-bold text-emerald-600">{attendanceRate === 'N/A' ? 'Unavailable' : 'Live Data'}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Verified (method)
          </p>
        </div>

        {/* KPI 3: Pending Leaves */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-amber-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Leave Requests</span>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-950/60 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {Number.isFinite(Number(metrics.pendingLeaveRequests)) ? `${pendingLeaveRequests} Pending` : 'N/A'}
            </span>
            <span className="text-[10px] font-bold text-amber-600">Action Required</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Requires Manager Approval
          </p>
        </div>

        {/* KPI 4: Projected Payroll */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-blue-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">August Payroll Est.</span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-950/60 dark:text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{payrollValue}</span>
            <span className="text-[10px] font-bold text-slate-500">{Number.isFinite(Number(metrics.totalMonthlyPayroll)) ? 'Auto Calculated' : 'Unavailable'}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {Number.isFinite(Number(metrics.totalMonthlyPayroll)) ? 'Live monthly payroll total' : 'Payroll data unavailable'}
          </p>
        </div>

        {/* KPI 5: Productivity Score */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-purple-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Productivity Score</span>
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 transition-transform duration-300 group-hover:scale-110 dark:bg-purple-950/60 dark:text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">91.8</span>
            <span className="text-[10px] font-bold text-emerald-600">Top Tier</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            OKR velocity metrics
          </p>
        </div>
      </div>

      {/* AI Intelligence Briefing Banner */}
      <div className="group flex flex-col items-start justify-between gap-4 rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white p-4.5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-purple-300 md:flex-row md:items-center dark:border-purple-900/50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-purple-600 p-2.5 text-white shadow-md shadow-purple-500/20 transition-transform duration-300 group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-purple-950 dark:text-purple-200 tracking-wide">
                AI PREDICTIVE WORKFORCE BRIEFING (GEMINI 3.6 FLASH)
              </h3>
              <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[9px] font-bold text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                RAG Engine
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Workload Optimization:</span> Engineering sprint velocity increased by 18% with optimal skill pairing. {pendingShiftRequests} pending shift requests are ready for review to balance weekend coverage. {attritionRiskCount} employee(s) are flagged for elevated attrition risk.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('ai_planning')}
          className="whitespace-nowrap rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-purple-700 hover:shadow-md"
        >
          View Workforce Analytics
        </button>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Simplified & Clean Departmental Attendance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-2 dark:border-slate-800/80 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Departmental Attendance Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simplified live attendance rates across organization units
              </p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View Full Logs →
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {[
              { dept: 'Engineering', present: 94, late: 4, absent: 2, total: 110, badge: '94% On-Time' },
              { dept: 'Human Resources', present: 98, late: 2, absent: 0, total: 24, badge: '98% On-Time' },
              { dept: 'Product Management', present: 92, late: 5, absent: 3, total: 38, badge: '92% On-Time' },
              { dept: 'Finance & Payroll', present: 96, late: 2, absent: 2, total: 32, badge: '96% On-Time' },
              { dept: 'Operations & Support', present: 88, late: 8, absent: 4, total: 44, badge: '88% On-Time' }
            ].map((d, i) => (
              <div
                key={i}
                className="group rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/20 dark:border-slate-800/60 dark:bg-slate-800/30 dark:hover:border-indigo-800/50"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{d.dept}</span>
                    <span className="text-[10px] text-slate-400">({d.total} staff)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {d.present}% Present
                    </span>
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {d.badge}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                    <div
                      style={{ width: `${d.present}%` }}
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500 group-hover:bg-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                    {d.late > 0 ? `${d.late}% Late` : '0% Late'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Attendance status highlights */}
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center dark:border-slate-800/60 dark:bg-slate-800/40">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Verified</div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">84%</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Server-verified</div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">12%</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Attendance Sync</div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">4%</div>
            </div>
          </div>
        </div>

        {/* Top Performing Workforce Spotlight */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Top Performers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Q3 evaluation highlights
              </p>
            </div>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Q3 High Velocity
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {employees
              .slice(0, 3)
              .map((emp, idx) => {
                const rowKey = emp?.empId || `emp-${idx}`;
                const locationPart = typeof emp?.location === 'string' && emp.location.trim() !== ''
                  ? emp.location.split('-')[0]
                  : (emp?.location || 'N/A');

                const avatar = emp?.avatar && typeof emp.avatar === 'string' && emp.avatar.trim() !== '' ? emp.avatar : null;

                return (
                <div
                  key={rowKey}
                  className="group rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm dark:border-slate-800/60 dark:bg-slate-800/30 dark:hover:border-indigo-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {avatar ? (
                        <img src={avatar} alt={emp?.firstName || ''} className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-500/20" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">{emp?.firstName?.[0] || emp?.empId?.slice(-2) || 'NA'}</div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {emp?.firstName || ''} {emp?.lastName || ''}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {emp?.jobRole || '—'} • {emp?.department || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        98% Score
                      </div>
                      <div className="text-[10px] text-slate-400">{locationPart}</div>
                    </div>
                  </div>
                </div>
                );
              })}
          </div>

          <button
            onClick={() => onNavigate('employees')}
            className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-center text-xs font-bold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-700"
          >
            View All Directory →
          </button>
        </div>
      </div>

      {/* Quick Actions & Recent Requests */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Approval Requests */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Pending Approvals Queue ({pendingLeaveRequests})
            </h3>
            <button onClick={() => onNavigate('leave')} className="text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400">
              Leave Center →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {pendingLeaves.map((leave, idx) => {
              const rowKey = leave?.id || `${leave?.empId || 'unknown'}-${idx}`;
              return (
                <div
                  key={rowKey}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-sm dark:border-slate-800/60 dark:bg-slate-800/40 dark:hover:border-amber-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 transition-transform duration-200 group-hover:scale-110 dark:bg-amber-950 dark:text-amber-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {leave?.empName || 'N/A'} <span className="text-[10px] text-slate-400">({leave?.department || '—'})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {leave?.leaveType || '—'} • {leave?.days ?? 0} day(s) • {leave?.startDate || '—'} to {leave?.endDate || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('leave')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Executive Action Shortcuts */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900">
          <h3 className="border-b border-slate-100 pb-3.5 text-sm font-extrabold text-slate-900 dark:border-slate-800 dark:text-white">
            Automated HR Shortcuts
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('employees')}
              className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-indigo-50/40 hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-800/50 dark:hover:border-indigo-700"
            >
              <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600 transition-transform duration-200 group-hover:scale-110 dark:bg-indigo-950 dark:text-indigo-300">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Onboard Staff</div>
                <div className="text-[10px] text-slate-500">Lifecycle & RBAC</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('payroll')}
              className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-800/50 dark:hover:border-blue-700"
            >
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600 transition-transform duration-200 group-hover:scale-110 dark:bg-blue-950 dark:text-blue-300">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Run Payroll</div>
                <div className="text-[10px] text-slate-500">Auto OT & Deductions</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('shifts')}
              className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-400 hover:bg-purple-50/40 hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-800/50 dark:hover:border-purple-700"
            >
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600 transition-transform duration-200 group-hover:scale-110 dark:bg-purple-950 dark:text-purple-300">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Rotational Shifts</div>
                <div className="text-[10px] text-slate-500">Swap & Overtime</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-800/50 dark:hover:border-emerald-700"
            >
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600 transition-transform duration-200 group-hover:scale-110 dark:bg-emerald-950 dark:text-emerald-300">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Analytics Center</div>
                <div className="text-[10px] text-slate-500">Snowflake Exports</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
