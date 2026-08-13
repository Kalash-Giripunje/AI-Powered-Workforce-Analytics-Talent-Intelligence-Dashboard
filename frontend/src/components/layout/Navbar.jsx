import React from 'react';
import {
  Sparkles,
  Bell,
  Search,
  Shield,
  UserCheck,
  User,
  SlidersHorizontal,
  Building2,
  ChevronDown,
  Bot
} from 'lucide-react';



export const Navbar = ({
  userRole,
  setUserRole,
  onOpenAIChat,
  onToggleNotifications,
  unreadCount,
  searchQuery,
  setSearchQuery,
  currentEmpName
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-all sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              NEXUS<span className="text-indigo-600 dark:text-indigo-400">.AI</span>
            </h1>
            <span className="hidden rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-700 sm:inline-block dark:bg-indigo-950/60 dark:text-indigo-300">
              ENTERPRISE HRMS
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Workforce Management Automation
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden max-w-md flex-1 px-8 md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee ID, department, skill, or policy..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
          />
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-3">
        {/* Role Switcher: HR Admin and Employee */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800/80">
          <button
            onClick={() => setUserRole('HR_ADMIN')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              userRole === 'HR_ADMIN'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Switch to HR Administrator View"
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">HR Admin</span>
          </button>
          <button
            onClick={() => setUserRole('EMPLOYEE')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              userRole === 'EMPLOYEE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Switch to Employee Self-Service View"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Employee Self-Service</span>
          </button>
        </div>

        {/* Nexus AI Assistant Quick Trigger */}
        <button
          onClick={onOpenAIChat}
          className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-[1.5px] shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/20"
        >
          <div className="flex items-center gap-2 rounded-[10px] bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition-all duration-200 group-hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:bg-slate-850">
            <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="tracking-tight">Nexus AI Assistant</span>
          </div>
        </button>

        {/* Notifications Drawer Toggle */}
        <button
          onClick={onToggleNotifications}
          className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="Notifications & Alerts"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
            alt="Profile"
            className="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700"
          />
          <div className="hidden text-left lg:block">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {currentEmpName}
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {userRole === 'HR_ADMIN' ? 'Global HR Admin' : 'Employee Self-Service'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
