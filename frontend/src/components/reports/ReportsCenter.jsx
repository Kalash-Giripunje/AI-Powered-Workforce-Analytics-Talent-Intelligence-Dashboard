import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Database,
  FileSpreadsheet,
  Share2,
  Calendar,
  Filter,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Sliders,
  Send
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { api } from '../../services/api';

export const ReportsCenter = ({ employees = [], payroll = [], leaves = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [selectedPeriod, setSelectedPeriod] = useState('August 2026 (Current Month)');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // ANALYTICS vs PREGENERATED
  const [reportSummary, setReportSummary] = useState([]);
  const [reportSummaryLoading, setReportSummaryLoading] = useState(false);
  const [reportSummaryError, setReportSummaryError] = useState(null);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const deptData = [
    { name: 'Engineering', employees: 142, payroll: 1850000, attendanceRate: 98.2 },
    { name: 'Operations', employees: 68, payroll: 620000, attendanceRate: 96.5 },
    { name: 'Product Mgmt', employees: 34, payroll: 490000, attendanceRate: 99.1 },
    { name: 'Finance & Payroll', employees: 22, payroll: 290000, attendanceRate: 97.8 },
    { name: 'Human Resources', employees: 18, payroll: 210000, attendanceRate: 98.9 }
  ];

  const leaveBreakdown = [
    { name: 'Approved Casual Leave', value: 42, color: '#6366f1' },
    { name: 'Sick Leave', value: 28, color: '#10b981' },
    { name: 'Privilege Leave', value: 18, color: '#8b5cf6' },
    { name: 'Parental Leave', value: 8, color: '#3b82f6' }
  ];

  const attendanceTrendData = [
    { day: 'Mon', onTime: 96, biometric: 88, gpsGeofenced: 92 },
    { day: 'Tue', onTime: 98, biometric: 92, gpsGeofenced: 95 },
    { day: 'Wed', onTime: 94, biometric: 86, gpsGeofenced: 89 },
    { day: 'Thu', onTime: 97, biometric: 91, gpsGeofenced: 94 },
    { day: 'Fri', onTime: 95, biometric: 89, gpsGeofenced: 91 },
    { day: 'Sat', onTime: 99, biometric: 95, gpsGeofenced: 97 }
  ];

  const overtimeDeptData = [
    { dept: 'Engineering', hours: 320, allowance: 14400 },
    { dept: 'Operations', hours: 240, allowance: 9600 },
    { dept: 'Product Mgmt', hours: 90, allowance: 4050 },
    { dept: 'Finance & Payroll', hours: 110, allowance: 4950 },
    { dept: 'Human Resources', hours: 45, allowance: 1800 }
  ];

  useEffect(() => {
    fetchReportSummary();
  }, []);

  async function fetchReportSummary() {
    setReportSummaryLoading(true);
    setReportSummaryError(null);
    try {
      const response = await api.getReportSummary();
      const items = Array.isArray(response) ? response : [];
      setReportSummary(items);
    } catch (err) {
      console.error('Failed to load report summary:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to load report summary';
      setReportSummaryError(message);
      setReportSummary([]);
    } finally {
      setReportSummaryLoading(false);
    }
  }

  async function handleGenerateCustomReport() {
    const payload = {
      department: selectedDept === 'ALL' ? 'All' : selectedDept,
      dateRange: selectedPeriod,
      format: selectedFormat
    };

    setGenerationLoading(true);
    setGenerationError(null);
    setDownloadSuccess(null);

    try {
      const response = await api.generateReport(payload);
      setGeneratedReport(response || null);
      setDownloadSuccess(response?.reportName || 'Custom report generated');
    } catch (err) {
      console.error('Failed to generate report:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to generate report';
      setGenerationError(message);
      setGeneratedReport(null);
    } finally {
      setGenerationLoading(false);
    }
  }

  const handleDownload = (title) => {
    setDownloadSuccess(title);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const filteredReports = reportSummary.filter((report) => {
    if (selectedCategory === 'ALL') return true;
    const category = report.category || '';
    return category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Enterprise Analytics & Intelligence Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Deep workforce metrics, automated compliance reporting, and Snowflake ERP data downloads
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('Snowflake Full Workforce Sync')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
          >
            <Database className="h-4 w-4" />
            Sync Snowflake Pipeline
          </button>
        </div>
      </div>

      {/* Download Alert Banner */}
      {downloadSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {generatedReport ? `Generated: ${generatedReport.reportName}` : `Successfully exported "${downloadSuccess}"! File downloaded to local system.`}
        </div>
      )}

      {generationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {generationError}
        </div>
      )}

      {reportSummaryError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
          {reportSummaryError}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === 'ANALYTICS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Deep HR Analytics & Custom Builder
        </button>

        <button
          onClick={() => setActiveTab('PREGENERATED')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === 'PREGENERATED'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          Pre-Generated Statements & Downloads ({reportSummary.length})
        </button>
      </div>

      {activeTab === 'ANALYTICS' ? (
        <div className="space-y-6">
          {/* Custom Report Configuration Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Sliders className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Custom Analytics Filter & Exporter</h3>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Time Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="August 2026 (Current Month)">August 2026 (Current Month)</option>
                  <option value="July 2026">July 2026</option>
                  <option value="Q2 2026 Executive Summary">Q2 2026 Executive Summary</option>
                  <option value="Year-to-Date 2026">Year-to-Date 2026</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Operations">Operations</option>
                  <option value="Product Mgmt">Product Management</option>
                  <option value="Finance & Payroll">Finance & Payroll</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Export Format</label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="PDF">Formatted PDF Document</option>
                  <option value="XLSX">Excel Spreadsheet (.xlsx)</option>
                  <option value="CSV">Raw CSV Data Stream</option>
                  <option value="JSON">Snowflake JSON Pipeline</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateCustomReport}
                  disabled={generationLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 px-3 font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Download className="h-4 w-4" />
                  {generationLoading ? 'Generating...' : 'Export Custom Report'}
                </button>
              </div>
            </div>
          </div>

          {generatedReport && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{generatedReport.reportName || 'Generated Report Summary'}</h3>
                  <p className="text-xs text-slate-500">Department: {generatedReport.departmentFilter || 'N/A'} • Generated: {generatedReport.generatedAt || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Records</div>
                  <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">{generatedReport.totalRecords ?? 'N/A'}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Avg Tenure</div>
                  <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">{generatedReport.metrics?.avgTenureYears ?? 'N/A'} yrs</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Attendance Rate</div>
                  <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">{generatedReport.metrics?.attendanceRate ?? 'N/A'}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Overtime Pay</div>
                  <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">{generatedReport.metrics?.overtimePayTotal ?? 'N/A'}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Payroll Cost</div>
                  <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">{generatedReport.metrics?.payrollCostTotal ?? 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Deep Data Visualizations */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Department Payroll & Headcount Chart */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-indigo-700">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Compensation & Headcount Distribution</h3>
                  <p className="text-xs text-slate-500">Monthly gross payroll cost ($) vs active team count</p>
                </div>
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Live Aggregate
                </span>
              </div>

              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="payroll" fill="#6366f1" name="Payroll ($)" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="employees" fill="#10b981" name="Headcount" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leave Type Allocation Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leave Category Utilization Breakdown</h3>
                  <p className="text-xs text-slate-500">Days approved across leave types this month</p>
                </div>
                <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  96 Days Total
                </span>
              </div>

              <div className="mt-4 flex flex-col items-center justify-center sm:flex-row gap-4 h-64">
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leaveBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {leaveBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  {leaveBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.value} days</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance & Biometric Verification Trends Area Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Biometric & GPS Verification Velocity (%)</h3>
                  <p className="text-xs text-slate-500">Weekly compliance rates for Facial AI & GPS Geofence check-ins</p>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  97.4% Avg Compliance
                </span>
              </div>

              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrendData}>
                    <defs>
                      <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorBiometric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="onTime" stroke="#10b981" fillOpacity={1} fill="url(#colorOnTime)" name="On-Time Check-in %" />
                    <Area type="monotone" dataKey="biometric" stroke="#6366f1" fillOpacity={1} fill="url(#colorBiometric)" name="Facial/Biometric %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Overtime Hours & Allowances Bar Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Overtime Hours & Disbursed Allowances</h3>
                  <p className="text-xs text-slate-500">Approved overtime hours logged vs total overtime payout ($)</p>
                </div>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  805 Hours Total
                </span>
              </div>

              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overtimeDeptData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="hours" fill="#f59e0b" name="Overtime Hours" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="allowance" fill="#3b82f6" name="Allowance ($)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Pre-generated Reports Catalog */
        <div className="space-y-4">
          {/* Category Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="font-bold text-slate-600 dark:text-slate-400">Category Filter:</span>
              {['ALL', 'Executive', 'Finance', 'Operations', 'Talent Management'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-3 py-1 font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <span className="text-slate-500 font-medium">
              Showing {filteredReports.length} reports
            </span>
          </div>

          {reportSummaryLoading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Loading report summaries...
            </div>
          )}

          {!reportSummaryLoading && !reportSummaryError && filteredReports.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              No report summaries are currently available from the backend.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id || report.title}
                className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-indigo-700"
              >
                <div className="flex items-start gap-3.5">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {report.id || 'N/A'}
                      </span>
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {report.category || 'General'}
                      </span>
                      <span className="text-[10px] text-slate-400">Updated {report.lastGenerated || 'N/A'}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {report.title || 'Report'}
                    </h3>

                    <div className="text-[11px] font-medium text-slate-400">
                      Format: <span className="text-slate-700 dark:text-slate-300">{report.format || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <button
                    onClick={() => handleDownload(report.title || 'Report')}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>

                  <button
                    onClick={() => handleDownload(`Share ${report.title || 'Report'}`)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
