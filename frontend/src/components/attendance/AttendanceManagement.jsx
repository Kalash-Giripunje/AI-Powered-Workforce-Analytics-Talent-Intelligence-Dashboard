import React, { useState, useEffect } from 'react';
import {
  Clock,
  ScanFace,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Fingerprint,
  Calendar,
  Filter,
  Search,
  UserCheck,
  Coffee,
  ShieldCheck,
  Camera,
  Activity
} from 'lucide-react';

export const AttendanceManagement = ({
  attendanceRecords,
  attendanceLoading = false,
  attendanceError = null,
  employees = [],
  selectedEmployeeId,
  onSelectEmployee,
  onCheckIn,
  onCheckOut,
  isCheckedIn,
  currentCheckInTime
}) => {
  const [selectedMethod, setSelectedMethod] = useState('Facial Recognition');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const q = (searchQuery || '').toLowerCase();
  const filteredLogs = (attendanceRecords || []).filter((rec) => {
    const matchesStatus = filterStatus === 'ALL' || rec.status === filterStatus;
    const name = (rec.empName || '').toString();
    const dept = (rec.department || '').toString();
    const matchesSearch = name.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const anomalyCount = (attendanceRecords || []).filter((r) => r.isAnomaly).length;

  return (
    <div className="space-y-6">
      {attendanceError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm">
          Error loading attendance: {attendanceError}
        </div>
      )}
      {attendanceLoading && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800 text-sm">
          Loading attendance...
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Automated Attendance & Verification Console
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-modal verification (Facial Recognition, Biometric, GPS Geofencing) with AI Anomaly Detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Biometric Gate #3 Active
          </span>
        </div>
      </div>

      {/* Live Check-In / Check-Out Punch Station */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Punch Console */}
        <div className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 text-white shadow-2xl transition-all duration-300 hover:border-indigo-400 hover:shadow-indigo-950/50 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold tracking-tight">EMPLOYEE ATTENDANCE PUNCH STATION</h3>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              HQ ONLINE VERIFICATION
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left Column: Verification Mode & Camera Viewfinder */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Select Employee
                </span>
                <div className="relative mb-3">
                  <select
                    value={selectedEmployeeId || ''}
                    onChange={(e) => onSelectEmployee?.(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select employee...</option>
                    {(employees || []).map((employee) => (
                      <option key={employee.empId} value={employee.empId}>
                        {employee.firstName || ''} {employee.lastName || ''} ({employee.empId})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Select Verification Method
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Facial Recognition')}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition ${
                      selectedMethod === 'Facial Recognition'
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ScanFace className="h-4 w-4 text-indigo-300" />
                    Facial AI
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('GPS')}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition ${
                      selectedMethod === 'GPS'
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    GPS Geofence
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Biometric')}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition ${
                      selectedMethod === 'Biometric'
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Fingerprint className="h-4 w-4 text-amber-400" />
                    Biometric
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('QR Code')}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition ${
                      selectedMethod === 'QR Code'
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="h-4 w-4 text-cyan-400" />
                    QR Scan
                  </button>
                </div>
              </div>

              {/* Viewfinder Preview Box */}
              <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-slate-900/90 p-3 text-center">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                  <span className="flex items-center gap-1">
                    <Camera className="h-3 w-3 text-indigo-400" />
                    {selectedMethod} Camera Feed
                  </span>
                  <span className="text-emerald-400 font-mono">LAT: 37.7749° | LON: -122.4194°</span>
                </div>

                <div className="relative h-20 w-full rounded-lg border border-dashed border-indigo-400/40 bg-slate-950 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
                  {selectedMethod === 'Facial Recognition' && (
                    <ScanFace className="h-8 w-8 text-indigo-400" />
                  )}
                  {selectedMethod === 'GPS' && (
                    <MapPin className="h-8 w-8 text-emerald-400" />
                  )}
                  {selectedMethod === 'Biometric' && (
                    <Fingerprint className="h-8 w-8 text-amber-400" />
                  )}
                  {selectedMethod === 'QR Code' && (
                    <QrCode className="h-8 w-8 text-cyan-400" />
                  )}
                  <span className="mt-1 text-[10px] font-mono text-slate-300">
                    Geofence Zone A • 15m Radius Match
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Clock & Punch Action */}
            <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                System Time (PST)
              </span>
              <div className="my-1 text-3xl font-black tracking-tight font-mono text-white text-shadow">
                {liveTime}
              </div>
              <span className="text-[10px] text-slate-400 mb-4 font-semibold">
                Shift: Morning (09:00 - 18:00)
              </span>

              <div className="flex items-center gap-4">
                {!isCheckedIn ? (
                  <button
                    onClick={() => onCheckIn(selectedMethod)}
                    className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/30 transition hover:scale-105 active:scale-95"
                  >
                    <div className="flex flex-col items-center text-white">
                      <UserCheck className="h-8 w-8" />
                      <span className="text-[11px] font-black mt-1">CHECK IN</span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={onCheckOut}
                    className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 shadow-xl shadow-rose-600/30 transition hover:scale-105 active:scale-95"
                  >
                    <div className="flex flex-col items-center text-white">
                      <Clock className="h-8 w-8" />
                      <span className="text-[11px] font-black mt-1">CHECK OUT</span>
                    </div>
                  </button>
                )}
              </div>

              {isCheckedIn && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setIsOnBreak(!isOnBreak)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-bold transition ${
                      isOnBreak
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Coffee className="h-3.5 w-3.5" />
                    {isOnBreak ? 'Resume Work' : 'Start Meal Break'}
                  </button>
                </div>
              )}

              <p className="mt-3 text-[11px] text-slate-400 font-medium">
                {isCheckedIn
                  ? isOnBreak
                    ? 'Currently on Meal Break'
                    : 'Checked in via ' + selectedMethod + ' at ' + (currentCheckInTime || '08:52 AM')
                  : 'Ready for verification punch'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Anomaly Radar Panel */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-amber-700">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                AI Anomaly Detector ({anomalyCount})
              </h3>
            </div>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Live Alert
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {(attendanceRecords || [])
              .filter((r) => r.isAnomaly)
              .map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs transition-all duration-200 hover:border-amber-300 hover:shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>{rec.empName || '—'}</span>
                    <span className="text-rose-600 font-extrabold">{rec.status || '—'}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-900 dark:text-amber-300">
                    {rec.anomalyReason || ''}
                  </p>
                </div>
              ))}
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
                <th className="py-3 px-2">Verification Mode</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-2 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <img src={log.avatar || ''} alt={log.empName || ''} className="h-7 w-7 rounded-full object-cover" />
                    {log.empName || '—' }
                  </td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{log.department}</td>
                  <td className="py-3 px-2 font-mono text-slate-800 dark:text-slate-200">{log.checkIn}</td>
                  <td className="py-3 px-2 font-mono text-slate-800 dark:text-slate-200">{log.checkOut}</td>
                  <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">{log.workingHours} hrs</td>
                  <td className="py-3 px-2 text-slate-500 font-medium">{log.verificationMethod || '—'}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
