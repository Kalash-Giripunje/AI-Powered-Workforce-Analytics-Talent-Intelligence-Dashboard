import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Fingerprint,
  History,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserRound,
  Video,
  Wifi,
} from 'lucide-react';

import { api } from '../../services/api';

const METHOD_META = {
  GPS: {
    label: 'GPS',
    short: 'Secure location verification',
    icon: MapPin,
    accent: 'from-emerald-500/20 to-teal-500/10',
    ring: 'ring-emerald-200 dark:ring-emerald-900',
    button: 'bg-emerald-600 hover:bg-emerald-500',
  },
  FACE: {
    label: 'Face',
    short: 'Identity confirmation',
    icon: Video,
    accent: 'from-violet-500/20 to-indigo-500/10',
    ring: 'ring-violet-200 dark:ring-violet-900',
    button: 'bg-violet-600 hover:bg-violet-500',
  },
  BIOMETRIC: {
    label: 'Biometric',
    short: 'Secure authentication',
    icon: Fingerprint,
    accent: 'from-cyan-500/20 to-sky-500/10',
    ring: 'ring-cyan-200 dark:ring-cyan-900',
    button: 'bg-cyan-600 hover:bg-cyan-500',
  },
  REMOTE: {
    label: 'Remote',
    short: 'Secure remote check-in',
    icon: Wifi,
    accent: 'from-sky-500/20 to-cyan-500/10',
    ring: 'ring-sky-200 dark:ring-sky-900',
    button: 'bg-sky-600 hover:bg-sky-500',
  },
  QR: {
    label: 'QR / Kiosk',
    short: 'Workplace kiosk verification',
    icon: QrCode,
    accent: 'from-amber-500/20 to-orange-500/10',
    ring: 'ring-amber-200 dark:ring-amber-900',
    button: 'bg-amber-600 hover:bg-amber-500',
  },
  STANDARD: {
    label: 'Standard',
    short: 'Policy-based check-in',
    icon: ShieldCheck,
    accent: 'from-indigo-500/20 to-blue-500/10',
    ring: 'ring-indigo-200 dark:ring-indigo-900',
    button: 'bg-indigo-600 hover:bg-indigo-500',
  },
  DIRECT: {
    label: 'Direct',
    short: 'Quick attendance workflow',
    icon: CheckCircle2,
    accent: 'from-indigo-500/20 to-blue-500/10',
    ring: 'ring-indigo-200 dark:ring-indigo-900',
    button: 'bg-indigo-600 hover:bg-indigo-500',
  },
};

const WORK_MODE_META = {
  OFFICE: { label: 'Office', icon: '🏢', description: 'Office attendance with geofence enforcement' },
  REMOTE: { label: 'Remote / WFH', icon: '🏠', description: 'Remote workday with audit-based verification' },
  FIELD: { label: 'Field', icon: '🚗', description: 'Field work with location evidence' },
  HYBRID: { label: 'Hybrid', icon: '🔄', description: 'Office or remote depending on today\'s arrangement' },
  FLEXIBLE: { label: 'Flexible', icon: '🌐', description: 'Alternate-work-location attendance' },
};

const toText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text && text !== 'null' && text !== 'undefined' && text !== 'N/A' && text !== 'n/a') {
      return text;
    }
  }
  return '';
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeDateKey = (value) => {
  const text = toText(value);
  if (!text) return null;
  const parsed = new Date(`${text}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (value) => {
  const text = toText(value);
  if (!text) return '—';
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) return text;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return text;
};

const formatHourValue = (value) => {
  const hours = toNumber(value);
  if (!hours || hours <= 0) return '0.00 hrs';
  return `${hours.toFixed(2)} hrs`;
};

const formatDateLabel = (value) => {
  const text = toText(value);
  if (!text) return '—';
  const parsed = new Date(`${text}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getRecordValue = (record, keys) => {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return null;
};

const normalizeWorkMode = (value) => {
  const normalized = toText(value).toUpperCase();
  if (!normalized) return 'OFFICE';
  if (normalized.includes('REMOTE') || normalized.includes('WFH')) return 'REMOTE';
  if (normalized.includes('FIELD')) return 'FIELD';
  if (normalized.includes('HYBRID')) return 'HYBRID';
  if (normalized.includes('FLEX')) return 'FLEXIBLE';
  if (normalized.includes('OFFICE')) return 'OFFICE';
  return 'OFFICE';
};

const getMethodKey = (value) => {
  const normalized = toText(value).toUpperCase();
  if (!normalized) return 'DIRECT';
  if (normalized.startsWith('GPS') || normalized.includes('LOCATION')) return 'GPS';
  if (normalized.includes('FACE') || normalized.includes('FACIAL')) return 'FACE';
  if (normalized.includes('BIOMETRIC') || normalized.includes('FINGER')) return 'BIOMETRIC';
  if (normalized.includes('REMOTE')) return 'REMOTE';
  if (normalized.includes('QR') || normalized.includes('KIOSK')) return 'QR';
  if (normalized.includes('STANDARD')) return 'STANDARD';
  return 'DIRECT';
};

const calculateHaversineDistance = (latitudeA, longitudeA, latitudeB, longitudeB) => {
  const radius = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const dLat = toRadians(latitudeB - latitudeA);
  const dLon = toRadians(longitudeB - longitudeA);
  const lat1 = toRadians(latitudeA);
  const lat2 = toRadians(latitudeB);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getWorkdayTone = (status) => {
  if (status === 'Checked In') return 'WORKDAY ACTIVE';
  if (status === 'Checked Out') return 'WORKDAY COMPLETED';
  return 'READY TO START';
};

export const EmployeeAttendanceSelfService = ({
  employeeId,
  employeeName = 'Employee',
  attendanceRecords = [],
  onCheckIn = null,
  onCheckOut = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('GPS');
  const [selectedWorkMode, setSelectedWorkMode] = useState('OFFICE');
  const [selectedHybridArrangement, setSelectedHybridArrangement] = useState('OFFICE');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('Location permission issue');
  const [exceptionDescription, setExceptionDescription] = useState('');
  const [exceptionSubmitting, setExceptionSubmitting] = useState(false);
  const [attendanceContext, setAttendanceContext] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [gpsState, setGpsState] = useState({
    loading: false,
    error: '',
    latitude: null,
    longitude: null,
    accuracy: null,
    geofenceStatus: 'READY',
    distance: null,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const employeeAttendance = useMemo(() => {
    const items = Array.isArray(attendanceRecords) ? attendanceRecords : [];
    return items
      .filter((record) => {
        const recordEmpId = getRecordValue(record, ['empId', 'EmpID', 'EmpId', 'employeeId']);
        return recordEmpId && employeeId && String(recordEmpId) === String(employeeId);
      })
      .sort((a, b) => {
        const aDate = getRecordValue(a, ['date', 'Date']) || '';
        const bDate = getRecordValue(b, ['date', 'Date']) || '';
        const left = new Date(`${aDate}T00:00:00`).getTime();
        const right = new Date(`${bDate}T00:00:00`).getTime();
        return right - left;
      });
  }, [attendanceRecords, employeeId]);

  const todayKey = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todayRecord = employeeAttendance.find((record) => normalizeDateKey(getRecordValue(record, ['date', 'Date'])) === todayKey) || null;
  const currentCheckIn = getRecordValue(todayRecord, ['checkIn', 'CheckIn', 'checkin', 'checkInTime']);
  const currentCheckOut = getRecordValue(todayRecord, ['checkOut', 'CheckOut', 'checkout', 'checkOutTime']);
  const workingHours = todayRecord ? toNumber(getRecordValue(todayRecord, ['workingHours', 'WorkingHours'])) : 0;
  const attendanceStatus = !currentCheckIn ? 'Not Checked In' : currentCheckOut ? 'Checked Out' : 'Checked In';
  const workdayTone = getWorkdayTone(attendanceStatus);

  const liveHours = useMemo(() => {
    if (currentCheckOut && workingHours > 0) return workingHours;
    if (!currentCheckIn) return 0;
    const parts = String(currentCheckIn).split(':');
    if (parts.length < 2) return 0;
    const startHour = Number(parts[0]);
    const startMinute = Number(parts[1]);
    if (!Number.isFinite(startHour) || !Number.isFinite(startMinute)) return 0;
    const start = new Date();
    start.setHours(startHour, startMinute, 0, 0);
    const diffHours = (Date.now() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(diffHours, 0);
  }, [currentCheckIn, currentCheckOut, workingHours]);

  useEffect(() => {
    const fetchContext = async () => {
      if (!employeeId) return;
      try {
        const context = await api.getAttendanceContext(employeeId);
        setAttendanceContext(context || null);
        const primary = getMethodKey(context?.primary_method || context?.primaryMethod || 'GPS');
        setSelectedMethod(primary);
        const mode = normalizeWorkMode(context?.work_mode || context?.workMode || 'OFFICE');
        setSelectedWorkMode(mode);
        if (mode === 'HYBRID') {
          const hybridArrangement = normalizeWorkMode(context?.work_context?.arrangement || context?.workContext?.Arrangement || 'OFFICE');
          setSelectedHybridArrangement(hybridArrangement);
        }
      } catch (error) {
        setAttendanceContext(null);
        setSelectedMethod('DIRECT');
        setSelectedWorkMode('OFFICE');
      }
    };
    fetchContext();
  }, [employeeId]);

  useEffect(() => {
    const mode = normalizeWorkMode(attendanceContext?.work_mode || attendanceContext?.workMode || selectedWorkMode);
    setSelectedWorkMode(mode);
    if (mode === 'HYBRID') {
      const hybridArrangement = normalizeWorkMode(attendanceContext?.work_context?.arrangement || attendanceContext?.workContext?.Arrangement || selectedHybridArrangement || 'OFFICE');
      setSelectedHybridArrangement(hybridArrangement);
    }
  }, [attendanceContext]);

  useEffect(() => {
    if (!employeeId || selectedMethod !== 'GPS') return;
    if (!navigator?.geolocation) {
      setGpsState({
        loading: false,
        error: 'GPS access is unavailable on this browser.',
        latitude: null,
        longitude: null,
        accuracy: null,
        geofenceStatus: 'UNAVAILABLE',
        distance: null,
      });
      return;
    }

    setGpsState((prev) => ({ ...prev, loading: true, error: '' }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy ?? null;
        const officeLatitude = Number(attendanceContext?.officeLatitude ?? 0);
        const officeLongitude = Number(attendanceContext?.officeLongitude ?? 0);
        const geofenceRadius = Number(attendanceContext?.geofenceRadiusMeters ?? 200);
        const distance = Number.isFinite(officeLatitude) && Number.isFinite(officeLongitude)
          ? calculateHaversineDistance(latitude, longitude, officeLatitude, officeLongitude)
          : null;

        setGpsState({
          loading: false,
          error: '',
          latitude,
          longitude,
          accuracy,
          geofenceStatus: distance === null ? 'READY' : distance <= geofenceRadius ? 'INSIDE' : 'OUTSIDE',
          distance,
        });
      },
      (error) => {
        setGpsState({
          loading: false,
          error: error?.message || 'Location permission was denied.',
          latitude: null,
          longitude: null,
          accuracy: null,
          geofenceStatus: 'DENIED',
          distance: null,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [attendanceContext, employeeId, selectedMethod]);

  const effectiveWorkMode = useMemo(() => {
    const baseMode = normalizeWorkMode(selectedWorkMode || attendanceContext?.work_mode || attendanceContext?.workMode || 'OFFICE');
    if (baseMode !== 'HYBRID') return baseMode;
    return normalizeWorkMode(selectedHybridArrangement || attendanceContext?.work_context?.arrangement || attendanceContext?.workContext?.Arrangement || 'OFFICE');
  }, [attendanceContext, selectedHybridArrangement, selectedWorkMode]);

  const workModePolicy = useMemo(() => {
    const mode = effectiveWorkMode;
    const geofenceRequired = mode === 'OFFICE' || (mode === 'HYBRID' && selectedHybridArrangement === 'OFFICE');
    const gpsAuditOnly = mode === 'REMOTE' || mode === 'FLEXIBLE' || (mode === 'HYBRID' && selectedHybridArrangement === 'REMOTE');
    const requiresApproval = Boolean(attendanceContext?.requires_manager_approval || attendanceContext?.remote_approved === false || (mode === 'REMOTE' || mode === 'FLEXIBLE' || (mode === 'HYBRID' && selectedHybridArrangement === 'REMOTE')));

    return {
      mode,
      geofenceRequired,
      gpsAuditOnly,
      requiresApproval,
      policyLabel: geofenceRequired ? 'Office geofence required' : gpsAuditOnly ? 'GPS captured for audit only' : 'Policy-based verification',
      arrangementLabel: mode === 'OFFICE' ? 'Office' : mode === 'REMOTE' ? 'Remote / WFH' : mode === 'FIELD' ? 'Field' : mode === 'FLEXIBLE' ? 'Flexible location' : selectedHybridArrangement === 'REMOTE' ? 'Hybrid remote' : 'Hybrid office',
    };
  }, [attendanceContext, effectiveWorkMode, selectedHybridArrangement]);

  const allowedMethods = useMemo(() => {
    const methods = Array.isArray(attendanceContext?.allowed_methods || attendanceContext?.allowedMethods)
      ? attendanceContext.allowed_methods || attendanceContext.allowedMethods
      : ['GPS', 'FACE', 'BIOMETRIC', 'REMOTE', 'QR', 'STANDARD'];

    const dynamicMethods = methods
      .map((method) => getMethodKey(method))
      .filter((method, index, arr) => arr.indexOf(method) === index);

    if (effectiveWorkMode === undefined) return dynamicMethods;

    const mode = workModePolicy.mode;
    if (mode === 'OFFICE') return ['GPS', 'FACE', 'BIOMETRIC', 'QR', 'STANDARD', 'DIRECT'];
    if (mode === 'REMOTE') return ['REMOTE', 'FACE', 'STANDARD', 'GPS'];
    if (mode === 'FIELD') return ['GPS', 'FACE', 'STANDARD', 'DIRECT'];
    if (mode === 'FLEXIBLE') return ['GPS', 'FACE', 'STANDARD', 'REMOTE'];
    return dynamicMethods.length ? dynamicMethods : ['GPS', 'FACE', 'STANDARD', 'DIRECT'];
  }, [attendanceContext, workModePolicy.mode]);

  const exceptionOptions = [
    'Location permission issue',
    'GPS / location problem',
    'Outside assigned work location',
    'Working from alternate location',
    'Client / field visit',
    'Device problem',
    'Verification method unavailable',
    'Other',
  ];

  const handleExceptionSubmit = async () => {
    if (!employeeId) return;
    setExceptionSubmitting(true);
    try {
      const payload = {
        empId: employeeId,
        employeeName: employeeName || 'Employee',
        date: new Date().toISOString().split('T')[0],
        reason: exceptionReason,
        description: exceptionDescription || 'Attendance exception requested from adaptive employee check-in flow.',
        workMode: effectiveWorkMode,
        selectedVerificationMethod: selectedMethod,
        gpsData: {
          latitude: gpsState.latitude,
          longitude: gpsState.longitude,
          distanceFromOffice: gpsState.distance,
        },
        status: 'Pending',
        reviewStatus: 'Pending',
        createdAt: new Date().toISOString(),
      };

      await api.submitAttendanceException(payload);
      setShowExceptionModal(false);
      setExceptionDescription('');
      setStatusMessage('Attendance exception submitted successfully. HR will review it shortly.');
    } catch (error) {
      const backendMessage = error?.response?.data?.detail || error?.message || 'Exception submission failed.';
      setStatusMessage(backendMessage);
    } finally {
      setExceptionSubmitting(false);
    }
  };

  const monthSummary = useMemo(() => {
    const monthRecords = employeeAttendance.filter((record) => {
      const dateKey = normalizeDateKey(getRecordValue(record, ['date', 'Date']));
      if (!dateKey) return false;
      const [year, month] = dateKey.split('-').map(Number);
      const now = new Date();
      return year === now.getFullYear() && month === now.getMonth() + 1;
    });

    const present = monthRecords.filter((record) => {
      const status = toText(record?.status, record?.AttendanceStatus, record?.attendanceStatus).toLowerCase();
      const work = toNumber(record?.workingHours ?? record?.WorkingHours);
      return status === 'present' || status === 'late' || work > 0 || toText(record?.checkIn, record?.CheckIn, record?.checkInTime);
    }).length;

    const late = monthRecords.filter((record) => {
      const status = toText(record?.status, record?.AttendanceStatus, record?.attendanceStatus).toLowerCase();
      return status === 'late';
    }).length;

    const totalHours = monthRecords.reduce((sum, record) => sum + toNumber(record?.workingHours ?? record?.WorkingHours), 0);
    const averageHours = monthRecords.length ? totalHours / monthRecords.length : 0;
    const score = monthRecords.length ? Math.max(0, Math.min(100, Math.round((present / Math.max(monthRecords.length, 1)) * 100))) : 0;
    return {
      present,
      late,
      averageHours,
      score,
      totalHours,
    };
  }, [employeeAttendance]);

  const aiInsights = useMemo(() => {
    const insights = [];
    if (monthSummary.late > 0) {
      insights.push(`You have ${monthSummary.late} late arrival signal${monthSummary.late > 1 ? 's' : ''} this month.`);
    }
    if (currentCheckIn && !currentCheckOut) {
      insights.push('Current workday is active and running on schedule.');
    }
    if (monthSummary.present > 0) {
      insights.push(`Attendance is active across ${monthSummary.present} workday record${monthSummary.present > 1 ? 's' : ''}.`);
    }
    if (!insights.length) {
      insights.push('No attendance activity recorded yet for this month.');
    }
    return insights;
  }, [currentCheckIn, currentCheckOut, monthSummary]);

  const handleAction = async () => {
    if (!employeeId) {
      setStatusMessage('Employee identity is not available.');
      return;
    }

    if (workModePolicy.requiresApproval && selectedMethod === 'REMOTE' && !attendanceContext?.remote_approved && !(attendanceContext?.remoteApproved ?? false)) {
      setStatusMessage('Remote work approval is required before you can begin a remote attendance session.');
      setShowExceptionModal(true);
      return;
    }

    if (selectedMethod === 'GPS') {
      if (gpsState.loading) {
        setStatusMessage('Acquiring secure location before continuing.');
        return;
      }
      if (workModePolicy.geofenceRequired && gpsState.geofenceStatus === 'OUTSIDE') {
        setStatusMessage('Your location is outside the approved office zone. Please either move within the permitted area or request an exception.');
        setShowExceptionModal(true);
        return;
      }
      if (gpsState.geofenceStatus === 'DENIED' || gpsState.geofenceStatus === 'UNAVAILABLE') {
        setStatusMessage('GPS verification is currently unavailable. Please enable location access or choose a different verification method.');
        return;
      }
      if (gpsState.latitude === null || gpsState.longitude === null) {
        setStatusMessage('We still need your current GPS coordinates before verification can continue.');
        return;
      }
    }

    if (selectedMethod === 'FACE' || selectedMethod === 'BIOMETRIC' || selectedMethod === 'QR' || selectedMethod === 'REMOTE' || selectedMethod === 'STANDARD') {
      const configuredStatus = attendanceContext?.allowed_methods || attendanceContext?.allowedMethods || ['GPS', 'FACE', 'BIOMETRIC', 'REMOTE', 'QR', 'STANDARD'];
      const normalized = configuredStatus.map((method) => getMethodKey(method));
      if (!normalized.includes(selectedMethod)) {
        setStatusMessage(`${METHOD_META[selectedMethod]?.label || 'This verification'} method is not currently permitted for your workday policy.`);
        setShowExceptionModal(true);
        return;
      }
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const payload = {
        verificationMethod: selectedMethod,
        verificationStatus: selectedMethod === 'GPS' ? (gpsState.geofenceStatus === 'OUTSIDE' ? 'Location outside approved area' : 'Verified') : selectedMethod === 'REMOTE' ? 'Remote verification approved' : selectedMethod === 'DIRECT' ? 'Directly Approved' : 'Approved',
        workMode: effectiveWorkMode,
        ...(selectedMethod === 'GPS' && gpsState.latitude !== null && gpsState.longitude !== null ? { latitude: gpsState.latitude, longitude: gpsState.longitude } : {}),
      };

      if (currentCheckIn && !currentCheckOut) {
        const record = await onCheckOut?.(payload);
        if (record) {
          setStatusMessage('Check-out recorded successfully.');
        }
      } else {
        const record = await onCheckIn?.(payload);
        if (record) {
          setStatusMessage('Check-in recorded successfully.');
        }
      }
    } catch (error) {
      const backendMessage = error?.response?.data?.detail || error?.message || 'Attendance update failed.';
      const cleanMessage = backendMessage.toLowerCase().includes('check-out time must be later than check-in time')
        ? 'Unable to complete check-out. Check-out time must be later than your check-in time.'
        : backendMessage;
      setStatusMessage(cleanMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCheckIn = !currentCheckIn;
  const canCheckOut = Boolean(currentCheckIn && !currentCheckOut);
  const activeHeadline = canCheckOut ? 'CHECK OUT SAFELY' : canCheckIn ? 'START YOUR WORKDAY' : 'WORKDAY COMPLETED';
  const workProgress = currentCheckOut ? 100 : currentCheckIn ? Math.min(90, Math.max(12, (liveHours / 10) * 100)) : 4;
  const heroClock = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const heroDate = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      <div className="overflow-hidden rounded-[30px] border border-indigo-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.3),_transparent_30%),linear-gradient(135deg,#0f172a_0%,#1e1b4b_30%,#312e81_60%,#111827_100%)] p-6 shadow-[0_35px_100px_-30px_rgba(79,70,229,0.9)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200">Employee workday command center</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{getGreeting()}, {employeeName} 👋</h2>
            <p className="mt-2 max-w-2xl text-sm text-indigo-100/80">
              {attendanceContext?.policy_message || 'Ready to make today productive?'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-indigo-100/85">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{heroDate}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{attendanceContext?.work_mode || 'OFFICE'} mode</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{workdayTone}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-[28px] border border-white/10 bg-slate-900/25 px-4 py-4 backdrop-blur-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-indigo-200/30 bg-indigo-500/20 text-indigo-100 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
              <Clock3 className="h-7 w-7" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-indigo-200">Current time</div>
              <div className="mt-1 text-2xl font-black text-white">{heroClock}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">How are you working today?</div>
            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Work mode</h3>
          </div>
          <div className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            {WORK_MODE_META[effectiveWorkMode]?.label || 'Office'}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Object.entries(WORK_MODE_META).map(([modeKey, modeMeta]) => {
            const selected = selectedWorkMode === modeKey || (modeKey === 'HYBRID' && selectedWorkMode === 'HYBRID');
            const isHybridDayChoice = modeKey === 'HYBRID';
            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => {
                  setSelectedWorkMode(modeKey);
                  if (modeKey === 'HYBRID') {
                    setSelectedHybridArrangement('OFFICE');
                  }
                }}
                className={`rounded-[22px] border p-4 text-left transition-all duration-200 ${selected ? 'scale-[1.01] border-indigo-300 bg-indigo-50 shadow-[0_20px_45px_-25px_rgba(79,70,229,0.8)] dark:border-indigo-800 dark:bg-indigo-950/40' : 'border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-indigo-800'}`}
              >
                <div className="text-2xl">{modeMeta.icon}</div>
                <div className="mt-3 text-base font-black text-slate-900 dark:text-white">{modeMeta.label}</div>
                <div className="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{modeMeta.description}</div>
                {selected && <div className="mt-3 inline-flex rounded-full bg-indigo-600 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white">Selected</div>}
              </button>
            );
          })}
        </div>

        {selectedWorkMode === 'HYBRID' && (
          <div className="mt-5 rounded-[22px] border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">Hybrid workday</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedHybridArrangement('OFFICE')}
                className={`rounded-2xl border px-4 py-3 text-left transition ${selectedHybridArrangement === 'OFFICE' ? 'border-indigo-300 bg-white shadow-sm dark:border-indigo-700 dark:bg-slate-900' : 'border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/60'}`}
              >
                <div className="text-xl">🏢</div>
                <div className="mt-2 text-sm font-black text-slate-900 dark:text-white">Working from office</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedHybridArrangement('REMOTE')}
                className={`rounded-2xl border px-4 py-3 text-left transition ${selectedHybridArrangement === 'REMOTE' ? 'border-indigo-300 bg-white shadow-sm dark:border-indigo-700 dark:bg-slate-900' : 'border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/60'}`}
              >
                <div className="text-xl">🏠</div>
                <div className="mt-2 text-sm font-black text-slate-900 dark:text-white">Working remotely</div>
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Arrangement</div>
            <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{workModePolicy.arrangementLabel}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">GPS policy</div>
            <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{workModePolicy.geofenceRequired ? 'Office geofence' : workModePolicy.gpsAuditOnly ? 'Audit only' : 'Policy-based'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Policy</div>
            <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{attendanceContext?.policy_name || 'Adaptive Attendance Verification'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Approval</div>
            <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{workModePolicy.requiresApproval ? 'Required' : 'Not required'}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Workday status</div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{activeHeadline}</div>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${attendanceStatus === 'Checked In' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : attendanceStatus === 'Checked Out' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
              <UserRound className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <div className="relative flex h-44 w-44 items-center justify-center">
                <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="46" stroke="rgba(148,163,184,0.25)" strokeWidth="10" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    stroke="url(#workday-progress)"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={289}
                    strokeDashoffset={289 - (workProgress / 100) * 289}
                  />
                  <defs>
                    <linearGradient id="workday-progress" x1="0%" x2="100%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center">
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Workday</div>
                  <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{Math.round(workProgress)}%</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatHourValue(currentCheckOut ? workingHours : liveHours)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Check-In</div>
                  <div className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Start</div>
                </div>
                <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">{formatTime(currentCheckIn)}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Current</div>
                  <div className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">Live</div>
                </div>
                <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">{attendanceStatus}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Check-Out</div>
                  <div className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">End</div>
                </div>
                <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">{formatTime(currentCheckOut)}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[26px] border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">Verification</div>
              </div>
              <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">{selectedMethod}</div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-700 dark:text-slate-200">
              <span>{METHOD_META[selectedMethod]?.short || 'Quick attendance workflow'}</span>
              <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:bg-slate-900 dark:text-slate-200">{selectedMethod === 'GPS' ? (gpsState.geofenceStatus === 'OUTSIDE' ? 'ATTENTION REQUIRED' : gpsState.geofenceStatus) : 'READY'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Verification methods</div>
          </div>

          <div className="mt-4 grid gap-3">
            {Object.entries(METHOD_META).map(([methodKey, methodMeta]) => {
              const active = selectedMethod === methodKey;
              const Icon = methodMeta.icon;
              const isAvailable = allowedMethods.includes(methodKey) || methodKey === 'DIRECT';
              return (
                <button
                  key={methodKey}
                  type="button"
                  onClick={() => isAvailable && setSelectedMethod(methodKey)}
                  disabled={!isAvailable}
                  className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition ${active ? 'border-indigo-200 bg-indigo-50 ring-2 ring-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:ring-indigo-900' : 'border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-indigo-800'} ${!isAvailable ? 'cursor-not-allowed opacity-45' : ''}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${methodMeta.accent}`} />
                  <div className="relative flex items-start gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200 ${active ? 'ring-2 ring-indigo-200 dark:ring-indigo-800' : ''}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-black text-slate-900 dark:text-white">{methodMeta.label}</div>
                        {active && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white">Selected</span>}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{methodMeta.short}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Adaptive verification</div>
          </div>

          {selectedMethod === 'GPS' && (
            <div className="mt-5 space-y-4">
              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-emerald-900 dark:text-emerald-200">Location security</div>
                  <div className="rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white">{gpsState.loading ? 'Checking' : gpsState.geofenceStatus}</div>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/80">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${gpsState.loading ? 55 : gpsState.latitude !== null ? 92 : 18}%` }} />
                </div>
                <div className="mt-3 text-xs text-emerald-800 dark:text-emerald-200">
                  {gpsState.loading ? 'Acquiring secure location for attendance validation...' : gpsState.error ? gpsState.error : gpsState.latitude !== null ? 'Secure location captured successfully.' : 'Allow browser location access to validate your attendance zone.'}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Latitude</div>
                  <div className="mt-2 text-base font-black text-slate-900 dark:text-white">{gpsState.latitude !== null ? gpsState.latitude.toFixed(5) : '—'}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Longitude</div>
                  <div className="mt-2 text-base font-black text-slate-900 dark:text-white">{gpsState.longitude !== null ? gpsState.longitude.toFixed(5) : '—'}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Accuracy</div>
                  <div className="mt-2 text-base font-black text-slate-900 dark:text-white">{gpsState.accuracy !== null ? `${Math.round(gpsState.accuracy)} m` : '—'}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Distance</div>
                  <div className="mt-2 text-base font-black text-slate-900 dark:text-white">{gpsState.distance !== null ? `${Math.round(gpsState.distance)} m` : '—'}</div>
                </div>
              </div>

              {gpsState.geofenceStatus === 'OUTSIDE' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex items-center gap-2 text-sm font-black">
                    <AlertCircle className="h-4 w-4" />
                    Location attention required
                  </div>
                  <div className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                    Your current location is outside the assigned attendance zone. You may switch to another supported verification method or retry location capture.
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedMethod === 'FACE' && (
            <div className="mt-5 rounded-[26px] border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
                  <Video className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-violet-900 dark:text-violet-200">Face verification</div>
                  <div className="text-xs text-violet-700 dark:text-violet-300">Identity confirmation in progress</div>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] border border-dashed border-violet-300 bg-white/40 p-4 text-xs text-violet-800 dark:border-violet-700 dark:bg-slate-950/45 dark:text-violet-200">
                Camera-based identity verification is available in supported environments. If a device or permission is unavailable, the system will remain in a safe readiness state until verification can be completed.
              </div>
            </div>
          )}

          {selectedMethod === 'BIOMETRIC' && (
            <div className="mt-5 rounded-[26px] border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-900 dark:bg-cyan-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
                  <Fingerprint className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-cyan-900 dark:text-cyan-200">Biometric verification</div>
                  <div className="text-xs text-cyan-700 dark:text-cyan-300">Secure authentication</div>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] border border-dashed border-cyan-300 bg-white/40 p-4 text-xs text-cyan-800 dark:border-cyan-700 dark:bg-slate-950/45 dark:text-cyan-200">
                Biometrics are validated through the system’s secure authentication flow when supported by the enrolled device and security policy.
              </div>
            </div>
          )}

          {selectedMethod === 'QR' && (
            <div className="mt-5 rounded-[26px] border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
                  <QrCode className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-amber-900 dark:text-amber-200">QR / Kiosk verification</div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">Workplace kiosk validation</div>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] border border-dashed border-amber-300 bg-white/40 p-4 text-xs text-amber-800 dark:border-amber-700 dark:bg-slate-950/45 dark:text-amber-200">
                Scan the approved QR code or use the workplace kiosk to verify your attendance before starting or ending the workday.
              </div>
            </div>
          )}

          {selectedMethod === 'DIRECT' && (
            <div className="mt-5 rounded-[26px] border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-indigo-900 dark:text-indigo-200">Direct attendance</div>
                  <div className="text-xs text-indigo-700 dark:text-indigo-300">Quick attendance workflow</div>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] border border-dashed border-indigo-300 bg-white/40 p-4 text-xs text-indigo-800 dark:border-indigo-700 dark:bg-slate-950/45 dark:text-indigo-200">
                Direct attendance is available for a secure, intentional workday start or end, while still preserving the existing backend attendance check-in/check-out workflow.
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">AI attendance insights</div>
          </div>

          <div className="mt-4 space-y-3">
            {aiInsights.map((insight, index) => (
              <div key={`${insight}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <div className="text-sm text-slate-700 dark:text-slate-200">{insight}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">This month</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Present</div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{monthSummary.present}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Average hrs</div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{monthSummary.averageHours.toFixed(1)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">On time</div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{monthSummary.present > 0 ? `${Math.max(0, Math.round(((monthSummary.present - monthSummary.late) / Math.max(monthSummary.present, 1)) * 100))}%` : '0%'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Attendance score</div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{monthSummary.score}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Workday timeline</div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-2 h-[calc(100%-1rem)] w-0.5 bg-gradient-to-b from-indigo-300 via-indigo-400 to-sky-400 dark:from-indigo-700 dark:via-indigo-600 dark:to-sky-600" />
              <div className="space-y-4 pl-10">
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="absolute -left-[34px] top-5 h-3.5 w-3.5 rounded-full border-4 border-white bg-emerald-500 shadow-md dark:border-slate-900" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Check-in</div>
                  <div className="mt-1 text-base font-black text-slate-900 dark:text-white">{formatTime(currentCheckIn)}</div>
                </div>
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="absolute -left-[34px] top-5 h-3.5 w-3.5 rounded-full border-4 border-white bg-indigo-500 shadow-md dark:border-slate-900" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Current</div>
                  <div className="mt-1 text-base font-black text-slate-900 dark:text-white">{attendanceStatus}</div>
                </div>
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="absolute -left-[34px] top-5 h-3.5 w-3.5 rounded-full border-4 border-white bg-sky-500 shadow-md dark:border-slate-900" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Check-out</div>
                  <div className="mt-1 text-base font-black text-slate-900 dark:text-white">{formatTime(currentCheckOut)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TimerReset className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Primary action</div>
            </div>
            <div className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">{attendanceStatus}</div>
          </div>

          <div className="mt-5 rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 p-5 dark:border-indigo-900 dark:from-indigo-950/60 dark:via-slate-950/60 dark:to-indigo-950/40">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-700 dark:text-indigo-300">{canCheckOut ? 'Work in progress' : canCheckIn ? 'Ready to start' : 'Completed'}</div>
            <button
              type="button"
              onClick={handleAction}
              disabled={isSubmitting || (!canCheckIn && !canCheckOut)}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-base font-black text-white transition ${canCheckIn ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500' : canCheckOut ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' : 'bg-slate-400 cursor-not-allowed'} ${isSubmitting ? 'opacity-80' : ''}`}
            >
              {isSubmitting ? 'Updating...' : canCheckOut ? 'Check Out Safely' : canCheckIn ? 'Start Workday' : 'Workday Completed'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {statusMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                {statusMessage}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowExceptionModal(true)}
              className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40"
            >
              Request attendance exception
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Employee attendance history</div>
        </div>

        <div className="mt-5 space-y-3">
          {employeeAttendance.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
              No attendance history is available yet for this employee.
            </div>
          ) : (
            employeeAttendance.slice(0, 6).map((record, index) => {
              const recordDate = normalizeDateKey(getRecordValue(record, ['date', 'Date'])) || '—';
              const recordCheckIn = getRecordValue(record, ['checkIn', 'CheckIn', 'checkin', 'checkInTime']);
              const recordCheckOut = getRecordValue(record, ['checkOut', 'CheckOut', 'checkout', 'checkOutTime']);
              const recordHours = toNumber(getRecordValue(record, ['workingHours', 'WorkingHours']));
              const recordStatus = getRecordValue(record, ['status', 'AttendanceStatus', 'attendanceStatus']) || (recordCheckOut ? 'Present' : recordCheckIn ? 'Checked In' : 'Absent');
              const recordMethod = getMethodKey(getRecordValue(record, ['verificationMethod', 'VerificationMethod', 'verification', 'Verification']));

              return (
                <div key={`${recordEmpIdKey(record)}-${recordDate}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-indigo-800">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">{formatDateLabel(recordDate)}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{recordStatus}</div>
                    </div>
                    <div className="inline-flex w-fit items-center rounded-full bg-indigo-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">{recordMethod}</div>
                  </div>
                  <div className="grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-4">
                    <div><span className="font-semibold text-slate-500 dark:text-slate-400">In:</span> {formatTime(recordCheckIn)}</div>
                    <div><span className="font-semibold text-slate-500 dark:text-slate-400">Out:</span> {formatTime(recordCheckOut)}</div>
                    <div><span className="font-semibold text-slate-500 dark:text-slate-400">Hours:</span> {formatHourValue(recordHours)}</div>
                    <div><span className="font-semibold text-slate-500 dark:text-slate-400">Method:</span> {recordMethod}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showExceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_40px_90px_-35px_rgba(15,23,42,0.5)] dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Attendance exception</div>
                <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Request attendance exception</h3>
              </div>
              <button type="button" onClick={() => setShowExceptionModal(false)} className="rounded-full border border-slate-200 px-2.5 py-1 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">Close</button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reason</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {exceptionOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setExceptionReason(option)}
                      className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${exceptionReason === option ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  value={exceptionDescription}
                  onChange={(event) => setExceptionDescription(event.target.value)}
                  rows={4}
                  placeholder="Add a brief explanation for the exception request..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-indigo-700 dark:focus:ring-indigo-900"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Work mode</div>
                  <div className="mt-2 text-sm font-black text-slate-900 dark:text-white">{WORK_MODE_META[effectiveWorkMode]?.label || effectiveWorkMode}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Selected verification</div>
                  <div className="mt-2 text-sm font-black text-slate-900 dark:text-white">{METHOD_META[selectedMethod]?.label || selectedMethod}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowExceptionModal(false)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
              <button type="button" onClick={handleExceptionSubmit} disabled={exceptionSubmitting} className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-75">
                {exceptionSubmitting ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function recordEmpIdKey(record) {
  return toText(record?.empId, record?.EmpID, record?.EmpId, record?.employeeId, record?._id);
}
