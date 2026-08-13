import React, { useState } from 'react';
import { Banknote, Download, FileText, CheckCircle2, DollarSign, Calculator, RefreshCw } from 'lucide-react';



export const PayrollManagement = ({ payrollRecords = [], payrollLoading = false, payrollError = null }) => {
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const safePayrollRecords = Array.isArray(payrollRecords) ? payrollRecords : [];

  const totalGross = safePayrollRecords.reduce((acc, p) => {
    const baseSalary = Number(p?.baseSalary || 0);
    const overtimePay = Number(p?.overtimePay || 0);
    const performanceBonus = Number(p?.performanceBonus || 0);
    const computedGross = Number(p?.grossEarnings ?? baseSalary + overtimePay + performanceBonus);
    return acc + computedGross;
  }, 0);

  const totalNet = safePayrollRecords.reduce((acc, p) => acc + Number(p?.netPay || 0), 0);
  const totalOvertime = safePayrollRecords.reduce((acc, p) => acc + Number(p?.overtimePay || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Automated Payroll Inputs & Compensation Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time synchronization with biometric attendance, overtime multipliers, tax deductions, and ERP export
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
            <RefreshCw className="h-4 w-4" />
            Recalculate Inputs
          </button>

          <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700">
            <Download className="h-4 w-4" />
            Export Payroll File (CSV / ERP)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-indigo-700">
          <div className="text-xs font-semibold text-slate-500">Gross Payroll Expenditure</div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ${totalGross.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Includes base salaries & bonuses</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-blue-700">
          <div className="text-xs font-semibold text-slate-500">Automated Overtime Pay</div>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            ${totalOvertime.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">1.5x Approved Hours</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-emerald-700">
          <div className="text-xs font-semibold text-slate-500">Net Disbursed Pay</div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${totalNet.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Post tax & attendance deductions</div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-200 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-indigo-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              August 2026 Salary Disbursal Register
            </h3>
            <p className="text-xs text-slate-500">Automated calculations synced with attendance</p>
          </div>
          <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            Ready for Disbursal
          </span>
        </div>

        {payrollLoading && (
          <div className="mt-4 text-xs text-slate-500">Loading payroll...</div>
        )}

        {!payrollLoading && payrollError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {payrollError}
          </div>
        )}

        {!payrollLoading && !payrollError && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] dark:border-slate-800">
                  <th className="py-3 px-2">Employee</th>
                  <th className="py-3 px-2">Base Salary</th>
                  <th className="py-3 px-2">Overtime Pay</th>
                  <th className="py-3 px-2">Performance Bonus</th>
                  <th className="py-3 px-2">Tax Deductions</th>
                  <th className="py-3 px-2">Month</th>
                  <th className="py-3 px-2">Net Pay</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {safePayrollRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-6 px-2 text-center text-slate-500">
                      No payroll records available.
                    </td>
                  </tr>
                ) : (
                  safePayrollRecords.map((p) => {
                    const empDisplay = p?.empName || p?.empId || 'N/A';
                    const deptDisplay = p?.department || '-';
                    const monthDisplay = p?.month || 'N/A';
                    const baseSalary = Number(p?.baseSalary || 0);
                    const overtimePay = Number(p?.overtimePay || 0);
                    const performanceBonus = Number(p?.performanceBonus || 0);
                    const taxDeductions = Number(p?.taxDeductions || 0);
                    const netPay = Number(p?.netPay || 0);

                    return (
                      <tr key={p?.id || `${p?.empId || 'unknown'}-${monthDisplay}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">
                          {empDisplay}
                          <span className="block text-[10px] text-slate-400 font-normal">{deptDisplay}</span>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-800 dark:text-slate-200">${baseSalary.toLocaleString()}</td>
                        <td className="py-3 px-2 text-slate-700 dark:text-slate-300">
                          ${overtimePay.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-emerald-600 font-semibold">+${performanceBonus.toLocaleString()}</td>
                        <td className="py-3 px-2 text-rose-600 font-medium">-${taxDeductions.toLocaleString()}</td>
                        <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{monthDisplay}</td>
                        <td className="py-3 px-2 font-black text-slate-900 dark:text-white text-sm">${netPay.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => setSelectedPayslip(p)}
                            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                          >
                            <FileText className="h-3 w-3" />
                            View Payslip
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold">NEXUS ENTERPRISE PAYSLIP</h3>
                <p className="text-xs text-slate-500">Pay Period: {selectedPayslip.month || 'N/A'}</p>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg dark:bg-slate-800/60">
                <div>
                  <span className="text-slate-400 block">Employee</span>
                  <span className="font-bold text-sm">{selectedPayslip.empName || selectedPayslip.empId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Designation</span>
                  <span className="font-bold">{selectedPayslip.designation || '-'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-emerald-600 mb-1 border-b pb-1 dark:border-slate-800">EARNINGS</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Base Salary:</span>
                    <span className="font-mono">${Number(selectedPayslip.baseSalary || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Pay:</span>
                    <span className="font-mono">${Number(selectedPayslip.overtimePay || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance Bonus:</span>
                    <span className="font-mono">${Number(selectedPayslip.performanceBonus || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-rose-600 mb-1 border-b pb-1 dark:border-slate-800">DEDUCTIONS</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Income Tax Withholding:</span>
                    <span className="font-mono text-rose-600">-${Number(selectedPayslip.taxDeductions || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attendance Unpaid Leave Deductions:</span>
                    <span className="font-mono text-rose-600">-${Number(selectedPayslip.attendanceDeductions || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl dark:bg-indigo-950">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">TOTAL NET PAYOUT:</span>
                <span className="font-black text-indigo-700 dark:text-indigo-300 text-lg">${Number(selectedPayslip.netPay || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
              >
                Download PDF Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
