import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Building2,
  AlertTriangle,
  Award,
  ChevronRight,
  MoreVertical,
  X,
  CheckCircle2,
  Briefcase,
  TrendingUp,
  Zap
} from 'lucide-react';



export const EmployeeManagement = ({
  employees = [],
  onAddEmployee,
  onUpdateEmployee,
  employeesLoading = false,
  employeesError = null
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Employee Form State
  const [newEmp, setNewEmp] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    jobRole: 'Software Developer',
    monthlyIncome: 8000,
    location: 'Headquarters - New York',
    education: 'Bachelor of Computer Science',
    skills: 'React, Node.js, Python'
  });

  const departments = ['ALL', 'Engineering', 'Human Resources', 'Finance & Payroll', 'Product Management', 'Operations'];

  const empList = employees || [];
  const q = (search || '').toLowerCase();
  const filteredEmployees = empList.filter((emp) => {
    const fname = (emp.firstName || '').toString();
    const lname = (emp.lastName || '').toString();
    const jobRole = (emp.jobRole || '').toString();
    const empIdVal = (emp.empId || '').toString();

    const matchesSearch =
      fname.toLowerCase().includes(q) ||
      lname.toLowerCase().includes(q) ||
      empIdVal.toLowerCase().includes(q) ||
      jobRole.toLowerCase().includes(q);

    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const handleCreateEmployee = (e) => {
    e.preventDefault();
    const createdEmp = {
      // empId intentionally omitted - backend should assign or require empId explicitly
      firstName: newEmp.firstName,
      lastName: newEmp.lastName,
      email: newEmp.email,
      phone: newEmp.phone,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250`,
      gender: 'Male',
      age: 28,
      department: newEmp.department,
      jobRole: newEmp.jobRole,
      designation: 'Individual Contributor',
      jobLevel: 2,
      // managerId/managerName intentionally omitted to avoid fabricating relationships
      location: newEmp.location,
      status: 'Active',
      monthlyIncome: Number(newEmp.monthlyIncome),
      yearsAtCompany: 0,
      yearsInRole: 0,
      yearsWithManager: 0,
      // Performance and satisfaction fields left undefined if backend does not provide them
      skills: newEmp.skills.split(',').map((s) => s.trim()),
      education: newEmp.education,
      educationField: 'Technology',
      emergencyContact: { name: 'Emergency Contact', relationship: 'Family', phone: '+1 (555) 000-0000' },
      address: '100 Corporate Plaza, New York, NY'
    };

    onAddEmployee(createdEmp);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Employee Directory & Lifecycle Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Full workforce master database, role-based metadata, and performance analytics
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30"
        >
          <UserPlus className="h-4 w-4" />
          Onboard New Employee
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or job title..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  Dept: {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {employeesLoading ? (
            'Loading employees...'
          ) : (
            <>Showing <span className="text-slate-900 dark:text-white font-bold">{filteredEmployees.length}</span> records</>
          )}
        </div>
      </div>

      {/* Compact Employee Table Row Structure */}
      {employeesError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm">
          Error loading employees: {employeesError}
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200/80 bg-slate-50/90 text-[11px] font-extrabold tracking-wider text-slate-500 uppercase dark:border-slate-800/80 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3.5">EMP ID</th>
              <th className="px-4 py-3.5">Employee Name & Title</th>
              <th className="px-4 py-3.5">Department</th>
              <th className="px-4 py-3.5">Location</th>
              <th className="px-4 py-3.5">Performance Score</th>
              <th className="px-4 py-3.5">Productivity</th>
              <th className="px-4 py-3.5">Attrition Risk</th>
              <th className="px-4 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredEmployees.map((emp) => (
              <tr
                key={emp.empId}
                onClick={() => setSelectedEmployee(emp)}
                className="group cursor-pointer transition-all duration-200 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40"
              >
                <td className="whitespace-nowrap px-4 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {emp.empId}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-[11px] font-extrabold text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {emp.jobRole}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                  {emp.department}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-500 dark:text-slate-400">
                  {emp.location ? emp.location.split('-')[0] : 'Headquarters'}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                    <TrendingUp className="h-3 w-3" />
                    {emp.performanceScore != null ? `${emp.performanceScore} / 100` : 'Not available'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {emp.productivityScore != null ? `${emp.productivityScore}%` : 'Not available'}
                  </span>
                  <span className="ml-1 text-[10px] text-slate-400">Score</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      emp.attritionRisk === 'High'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : emp.attritionRisk === 'Medium'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : emp.attritionRisk === 'Low'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {emp.attritionRisk ? `${emp.attritionRisk} Risk` : 'Not available'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Detail Modal/Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-black text-base shadow-md shadow-indigo-500/20">
                  {selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <div className="text-xs text-slate-500">{selectedEmployee.designation} • {selectedEmployee.department}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      ID: {selectedEmployee.empId}
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6 text-xs">
              {/* Performance & Velocity Core Highlights */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3 dark:border-indigo-900/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-indigo-950 dark:text-indigo-200">
                      Performance Evaluation & Sprint Velocity
                    </span>
                  </div>
                  <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    Score: {selectedEmployee.performanceScore != null ? `${selectedEmployee.performanceScore} / 100` : 'Not available'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 block">Productivity Velocity</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      {selectedEmployee.productivityScore != null ? `${selectedEmployee.productivityScore}%` : 'Not available'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 block">KPI Completion Rate</span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {selectedEmployee.kpiCompletionRate != null ? `${selectedEmployee.kpiCompletionRate}%` : 'Not available'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 block">Goals Completed</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {selectedEmployee.goalsCompleted != null ? selectedEmployee.goalsCompleted : 'Not available'} / {selectedEmployee.totalGoals != null ? selectedEmployee.totalGoals : 'Not available'}
                    </span>
                  </div>
                </div>

                {/* AI Manager Feedback */}
                <div className="mt-3 pt-3 border-t border-indigo-100/80 dark:border-indigo-900/40">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    AI Manager Evaluation & Feedback:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
{selectedEmployee.aiFeedback ? `"${selectedEmployee.aiFeedback}"` : 'Not available'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Promotion Trajectory: {selectedEmployee.promotionRecommended !== false ? 'Recommended' : 'Standard Development Track'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Personal & Employment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block">Manager</span>
                  <span className="font-bold">{selectedEmployee.managerName || 'Not assigned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Monthly Compensation</span>
                  <span className="font-bold">{selectedEmployee.monthlyIncome != null ? `$${selectedEmployee.monthlyIncome.toLocaleString()} / mo` : 'Not available'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Work Location</span>
                  <span className="font-bold">{selectedEmployee.location || 'Not available'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tenure at Company</span>
                  <span className="font-bold">{selectedEmployee.yearsAtCompany != null ? `${selectedEmployee.yearsAtCompany} Years` : 'Not available'}</span>
                </div>
              </div>

              {/* Satisfaction Indicators */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h4 className="font-bold mb-3">Workplace Satisfaction Matrix (1 to 5)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">Work-Life Balance:</span>
                    <span className="font-bold ml-2">{selectedEmployee.workLifeBalanceScore} / 5</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Job Satisfaction:</span>
                    <span className="font-bold ml-2">{selectedEmployee.jobSatisfactionScore} / 5</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Environment Satisfaction:</span>
                    <span className="font-bold ml-2">{selectedEmployee.environmentSatisfactionScore} / 5</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Relationship Satisfaction:</span>
                    <span className="font-bold ml-2">{selectedEmployee.relationshipSatisfactionScore} / 5</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-bold mb-2">Verified Skill Competencies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEmployee.skills.map((skill, i) => (
                    <span key={i} className="rounded-md bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button onClick={() => setSelectedEmployee(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold">Onboard New Employee</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">First Name</label>
                  <input
                    required
                    type="text"
                    value={newEmp.firstName}
                    onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Last Name</label>
                  <input
                    required
                    type="text"
                    value={newEmp.lastName}
                    onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Payroll">Finance & Payroll</option>
                    <option value="Product Management">Product Management</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Monthly Salary ($)</label>
                  <input
                    type="number"
                    value={newEmp.monthlyIncome}
                    onChange={(e) => setNewEmp({ ...newEmp, monthlyIncome: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Job Role</label>
                <input
                  type="text"
                  value={newEmp.jobRole}
                  onChange={(e) => setNewEmp({ ...newEmp, jobRole: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={newEmp.skills}
                  onChange={(e) => setNewEmp({ ...newEmp, skills: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
