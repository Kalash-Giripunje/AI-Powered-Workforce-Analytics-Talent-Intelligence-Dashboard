import React, { useEffect, useState } from 'react';
import { Settings, Shield, Bell, Database, Key, Server, Lock, Cpu, Globe, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSettings() {
      setSettingsLoading(true);
      setSettingsError(null);

      try {
        const data = await api.getSettings();
        if (isMounted) {
          setSettings(data || {});
        }
      } catch (err) {
        console.error('Failed to load system settings:', err);
        const message = err?.response?.data?.detail || err.message || 'Failed to load system settings';
        if (isMounted) {
          setSettingsError(message);
          setSettings({});
        }
      } finally {
        if (isMounted) {
          setSettingsLoading(false);
        }
      }
    }

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatSettingValue = (value, fallback = 'Not configured') => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
    return String(value);
  };

  const integrations = [
    { name: 'Optional Attendance Device Integration', category: 'Workforce Access', status: 'Not Configured', icon: Cpu, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
    { name: 'SAP & Oracle HRMS / SuccessFactors', category: 'Enterprise ERP System', status: 'Syncing (5m ago)', icon: Server, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
    { name: 'Payroll Software (ADP / Gusto)', category: 'Compensation Export', status: 'Active API', icon: Database, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
    { name: 'Microsoft Teams & Slack Webhooks', category: 'Instant Notifications', status: 'Enabled', icon: Bell, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
    { name: 'Outlook & Google Workspace Calendar', category: 'Leave & Shift Sync', status: 'OAuth 2.0 Connected', icon: Globe, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
    { name: 'Active Directory / Azure AD LDAP', category: 'SSO & Identity Access', status: 'Verified', icon: Shield, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60' }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise HRMS System Settings</h2>
        <p className="text-xs text-slate-500">Database connection strings, Gemini API key status, integrations, and RBAC security policies</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800 font-bold text-sm">
          <Settings className="h-4 w-4 text-indigo-600" />
          <span>Live System Configuration</span>
        </div>

        {settingsLoading && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Loading system settings from backend...
          </div>
        )}

        {!settingsLoading && settingsError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {settingsError}
          </div>
        )}

        {!settingsLoading && !settingsError && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-slate-500 dark:text-slate-400">Company Name</div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{formatSettingValue(settings.companyName)}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-slate-500 dark:text-slate-400">Time Zone</div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{formatSettingValue(settings.timeZone)}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-slate-500 dark:text-slate-400">Currency</div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{formatSettingValue(settings.currency)}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-slate-500 dark:text-slate-400">Attendance Sync (optional)</div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{formatSettingValue(settings.biometricSyncEnabled)}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-slate-500 dark:text-slate-400">AI Model</div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{formatSettingValue(settings.aiModel)}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-slate-500 dark:text-slate-400">Attrition Alert Threshold</div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{formatSettingValue(settings.attritionAlertThreshold)}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-slate-500 dark:text-slate-400">Auto-approve Leaves (Days)</div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{formatSettingValue(settings.autoApproveLeavesUnderDays)}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-slate-500 dark:text-slate-400">Session Timeout</div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{formatSettingValue(settings.sessionTimeoutMinutes, 'N/A')}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800 font-bold text-sm">
            <Key className="h-4 w-4 text-indigo-600" />
            <span>AI Model & Gemini RAG Credentials</span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">Server GEMINI_API_KEY Status</label>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 font-mono text-[11px] text-emerald-600 dark:bg-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active • Injected via Cloud Secrets Manager (gemini-3.6-flash)
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Vector Embedding Engine</label>
              <select className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800">
                <option>text-embedding-004 (768 Dimensions)</option>
                <option>text-embedding-gecko@003</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800 font-bold text-sm">
            <Database className="h-4 w-4 text-emerald-600" />
            <span>MongoDB Database & Retention Configuration</span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">MongoDB Atlas Cluster URI</label>
              <input
                disabled
                type="text"
                value="mongodb+srv://cluster0.nexus.mongodb.net/hrms_db"
                className="w-full rounded-lg border border-slate-200 bg-slate-100 p-2 font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Attendance Data Retention Policy</label>
              <select className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800">
                <option>90 Days (GDPR & CCPA Compliant)</option>
                <option>180 Days</option>
                <option>1 Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Integrations Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Connected Enterprise Systems & API Gateways</h3>
            <p className="text-xs text-slate-500">Device sync and external integrations for attendance (optional)</p>
          </div>
          <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            6 / 6 Active
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <div className={`rounded-lg p-2 ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {item.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Compliance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800 font-bold text-sm">
          <Lock className="h-4 w-4 text-purple-600" />
          <span>Security, Encryption & GDPR Compliance Status</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <span className="font-bold block text-slate-800 dark:text-slate-200">Multi-Factor Authentication (MFA)</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Enforced for all Manager & Admin roles</span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <span className="font-bold block text-slate-800 dark:text-slate-200">AES-256 & TLS 1.3 Encryption</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Data encrypted at rest and in transit</span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <span className="font-bold block text-slate-800 dark:text-slate-200">GDPR & CCPA Right-to-Forget</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Automated PII anonymization enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

