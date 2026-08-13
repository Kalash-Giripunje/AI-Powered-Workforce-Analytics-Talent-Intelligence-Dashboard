import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CalendarRange,
  FileSpreadsheet,
  Banknote,
  TrendingUp,
  BrainCircuit,
  FileText,
  ShieldAlert,
  Settings,
  Bot
} from 'lucide-react';



export const Sidebar = ({
  activeTab,
  setActiveTab,
  userRole
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard, roles: ['HR_ADMIN'] },
    { id: 'attendance', label: 'Attendance & Check-in', icon: Clock, roles: ['HR_ADMIN', 'EMPLOYEE'] },
    { id: 'leave', label: 'Leave Applications', icon: CalendarDays, roles: ['HR_ADMIN', 'EMPLOYEE'] },
    { id: 'shifts', label: 'Shift Allocation & Requests', icon: CalendarRange, roles: ['HR_ADMIN', 'EMPLOYEE'] },
    { id: 'employees', label: 'Employee & Performance Mgmt', icon: Users, roles: ['HR_ADMIN'] },
    { id: 'timesheets', label: 'Timesheet & Billable Hours', icon: FileSpreadsheet, roles: ['HR_ADMIN'] },
    { id: 'payroll', label: 'Payroll & Compensation', icon: Banknote, roles: ['HR_ADMIN', 'EMPLOYEE'] },
    { id: 'ai_planning', label: 'AI Workforce Planning', icon: BrainCircuit, roles: ['HR_ADMIN'] },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText, roles: ['HR_ADMIN'] },
    { id: 'audit', label: 'Audit Logs & RBAC', icon: ShieldAlert, roles: ['HR_ADMIN'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['HR_ADMIN'] }
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="sticky top-16 z-20 hidden h-[calc(100vh-4rem)] w-64 flex-col border-r border-slate-200/80 bg-slate-50/90 backdrop-blur-md p-4 transition-all duration-300 lg:flex dark:border-slate-800/80 dark:bg-slate-900/90">
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        <div className="mb-3 px-3">
          <h3 className="text-[11px] font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            DASHBOARD
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">
            {userRole === 'HR_ADMIN' ? 'HR Workforce Hub' : 'Employee Self-Service'}
          </p>
        </div>

        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 translate-x-0.5'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 hover:translate-x-1 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                <span>{item.label}</span>
                {item.id === 'ai_planning' && (
                  <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-extrabold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Real-time Status Badge */}
      <div className="mt-auto rounded-xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/90 to-blue-50/90 p-3.5 shadow-sm transition-all duration-300 hover:border-indigo-200 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-slate-900">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
            Real-Time Engine Active
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          Live biometric sync & AI analytics primed
        </p>
      </div>
    </aside>
  );
};
