import React, { useEffect, useState } from 'react';
import {
  Bell,
  Bot,
  Building2,
  Check,
  ChevronDown,
  LogOut,
  Search,
  Shield,
  User,
} from 'lucide-react';

import { api } from '../../services/api';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { AVATAR_IDS, DEFAULT_AVATAR_ID } from '../../utils/avatars';

export const Navbar = ({
  userRole,
  onOpenAIChat,
  onToggleNotifications,
  unreadCount,
  searchQuery,
  setSearchQuery,
  currentEmpName,
  currentEmpId,
  profile,
  onLogout,
  onRequestChangePassword,
  onProfileUpdated,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(profile?.avatarId || profile?.avatar || DEFAULT_AVATAR_ID);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const roleLabel = userRole === 'HR_ADMIN' ? 'HR Admin' : userRole === 'MANAGER' ? 'Manager' : 'Employee Self-Service';

  useEffect(() => {
    if (profile?.avatarId || profile?.avatar) {
      setSelectedAvatarId(profile.avatarId || profile.avatar || DEFAULT_AVATAR_ID);
    } else {
      setSelectedAvatarId(DEFAULT_AVATAR_ID);
    }
  }, [profile]);

  const handleSaveAvatar = async () => {
    if (!selectedAvatarId) return;
    setSavingAvatar(true);
    setAvatarError('');
    try {
      const updatedProfile = await api.updateProfile({ avatarId: selectedAvatarId });
      if (typeof onProfileUpdated === 'function') {
        onProfileUpdated(updatedProfile || { avatarId: selectedAvatarId });
      }
      setAvatarPickerOpen(false);
    } catch (error) {
      setAvatarError(error?.response?.data?.detail || 'Unable to save the selected avatar.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const employeeProfile = profile || {};
  const profileFields = [
    ['Employee ID', employeeProfile.empId || employeeProfile.EmpID || employeeProfile.EmpId || employeeProfile.empID || currentEmpId || 'N/A'],
    ['Name', employeeProfile.name || employeeProfile.employeeName || employeeProfile.firstName || employeeProfile.fullName || currentEmpName || 'N/A'],
    ['Email', employeeProfile.email || employeeProfile.Email || 'N/A'],
    ['Phone', employeeProfile.phone || employeeProfile.Phone || 'N/A'],
    ['Department', employeeProfile.department || employeeProfile.Department || 'N/A'],
    ['Designation', employeeProfile.jobRole || employeeProfile.JobRole || employeeProfile.designation || employeeProfile.Designation || 'N/A'],
    ['Employment Status', employeeProfile.employmentStatus || employeeProfile.EmploymentStatus || 'N/A'],
    ['Joining Date', employeeProfile.joiningDate || employeeProfile.JoiningDate || 'N/A'],
    ['Manager', employeeProfile.managerName || employeeProfile.manager || employeeProfile.Manager || employeeProfile.ManagerID || 'N/A'],
    ['Location', employeeProfile.location || employeeProfile.Location || 'N/A'],
  ].filter(([, value]) => value && value !== 'N/A');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-all sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
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

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenAIChat}
          className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-[1.5px] shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/20"
        >
          <div className="flex items-center gap-2 rounded-[10px] bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition-all duration-200 group-hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:bg-slate-850">
            <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="tracking-tight">Nexus AI Assistant</span>
          </div>
        </button>

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

        <div className="relative border-l border-slate-200 pl-2 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-left transition hover:border-indigo-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/70 dark:hover:border-indigo-800 dark:hover:bg-slate-800"
          >
            <AvatarDisplay
              profile={profile}
              name={currentEmpName || 'User'}
              size="sm"
              className="border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
            />
            <div className="hidden text-left lg:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentEmpName || 'User'}</div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{roleLabel}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentEmpName || 'User'}</div>
                {currentEmpId && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">{currentEmpId}</div>
                )}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                  {userRole === 'HR_ADMIN' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {roleLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setProfileOpen(true);
                }}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout && onLogout();
                }}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <AvatarDisplay
                  profile={profile}
                  name={profile?.name || currentEmpName || 'Employee'}
                  size="lg"
                  className="border-0"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{profile?.name || currentEmpName || 'Employee'}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{currentEmpId}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profileFields.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Security</div>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPickerOpen((open) => !open);
                    setSelectedAvatarId(profile?.avatarId || profile?.avatar || DEFAULT_AVATAR_ID);
                  }}
                  className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                >
                  Change Avatar
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); if (onRequestChangePassword) onRequestChangePassword(); }}
                  className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); if (onLogout) onLogout(); }}
                  className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  Logout
                </button>
              </div>
            </div>

            {avatarPickerOpen && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Select Avatar</div>
                  <button
                    type="button"
                    onClick={() => setAvatarPickerOpen(false)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_IDS.map((avatarIdValue) => {
                    const isSelected = selectedAvatarId === avatarIdValue;
                    return (
                      <button
                        key={avatarIdValue}
                        type="button"
                        onClick={() => setSelectedAvatarId(avatarIdValue)}
                        className={`relative flex items-center justify-center rounded-2xl border p-2 transition ${isSelected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 dark:border-indigo-400 dark:bg-indigo-950/40 dark:ring-indigo-900' : 'border-slate-200 bg-white hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900'}`}
                        aria-label={`Select ${avatarIdValue}`}
                        title={avatarIdValue}
                      >
                        <AvatarDisplay
                          avatarId={avatarIdValue}
                          name={profile?.name || currentEmpName || 'User'}
                          size="lg"
                          className="border-0"
                        />
                        {isSelected && (
                          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {avatarError && (
                  <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {avatarError}
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPickerOpen(false);
                      setSelectedAvatarId(profile?.avatarId || profile?.avatar || DEFAULT_AVATAR_ID);
                      setAvatarError('');
                    }}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    disabled={savingAvatar}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingAvatar ? 'Saving...' : 'Save Avatar'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </header>
  );
};
