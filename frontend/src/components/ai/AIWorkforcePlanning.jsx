import React, { useState } from 'react';
import { BrainCircuit, Sliders, Sparkles, TrendingUp, Users, Award, CheckCircle2 } from 'lucide-react';

export const AIWorkforcePlanning = ({ employees }) => {
  const [hiringSimCount, setHiringSimCount] = useState(15);
  const [overtimeThreshold, setOvertimeThreshold] = useState(12);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-purple-400" />
          <span className="rounded bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-300">
            GEMINI RAG WORKFORCE MODELER
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-bold">Predictive AI Capacity & Skill Matrix Modeler</h2>
        <p className="mt-1 text-xs text-slate-300 max-w-3xl">
          Simulate strategic workforce capacity, department headcount growth, overtime management, and skill alignment across technical teams.
        </p>
      </div>

      {/* Simulator Controls & Capacity Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Scenario Controls */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-purple-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-purple-800">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Sliders className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Capacity Scenario Modeler</h3>
          </div>

          <div className="mt-4 space-y-5 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Planned Hiring Expansion</span>
                <span className="font-bold text-purple-600">+{hiringSimCount} Positions</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={hiringSimCount}
                onChange={(e) => setHiringSimCount(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Weekly Overtime Threshold Cap</span>
                <span className="font-bold text-indigo-600">{overtimeThreshold} Hours / Wk</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={overtimeThreshold}
                onChange={(e) => setOvertimeThreshold(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-[11px] text-purple-900 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-200">
              <span className="font-bold block mb-1">Simulated Capacity Outcome:</span>
              Adding +{hiringSimCount} headcount optimizes department workload by {Math.round(hiringSimCount * 1.8)}%, balancing team capacity and improving overall project delivery velocity.
            </div>
          </div>
        </div>

        {/* Talent Skill & Key Leader Matrix */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Key Talent & Leadership Matrix</h3>
              <p className="text-xs text-slate-500">Core engineers, lead architects, and domain specialists</p>
            </div>
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {employees.length} Active Profiles
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {employees.slice(0, 4).map((emp) => (
              <div
                key={emp.empId}
                className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-900/30 dark:bg-indigo-950/20"
              >
                <div className="flex items-center gap-3">
                  <img src={emp.avatar} alt={emp.firstName} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {emp.firstName} {emp.lastName} ({emp.empId})
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {emp.jobRole} • {emp.department} • Manager: {emp.managerName}
                    </div>
                    <div className="mt-1 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                      <span className="font-bold">Core Competencies:</span> {emp.skills.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> High Performance
                  </div>
                  <button className="mt-1 rounded-md bg-purple-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-purple-700">
                    Growth Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
