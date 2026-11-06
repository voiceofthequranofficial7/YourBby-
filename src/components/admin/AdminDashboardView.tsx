import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Shield,
  Users,
  Film,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Server,
  IndianRupee,
  Lock
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { adminOverview, handleReportAction } = useApp();

  if (!adminOverview) return null;
  const { stats, reports } = adminOverview;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 my-2">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-3xl border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              YourBby Super Admin Control Center
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Global governance, content moderation queue, platform infrastructure telemetry and user safety.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Systems Operational ({stats.serverUptime})</span>
        </div>
      </div>

      {/* Admin KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Users</span>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.totalUsers.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-500 font-semibold block mt-1">
            {stats.activeUsersDaily.toLocaleString()} DAU
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Posts & Media</span>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.totalPosts.toLocaleString()}
          </p>
          <span className="text-[10px] text-indigo-500 font-semibold block mt-1">
            {stats.totalReels.toLocaleString()} Reels
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Platform Revenue</span>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            ₹{(stats.revenueINR / 100000).toFixed(1)}L
          </p>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1">
            Razorpay Verified INR
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Pending Moderation</span>
          <p className="text-xl font-bold font-mono text-amber-500 mt-1 tabular-nums">
            {stats.pendingReports}
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-1">
            Requires Review
          </span>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Trust & Safety Content Moderation Queue
          </h3>
          <span className="text-xs text-slate-400">Audited by human admins with Gemini assistance</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {reports.map((report) => (
            <div key={report.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase">
                    {report.reason}
                  </span>
                  <span className="text-xs text-slate-400">
                    Reported by @{report.reportedBy.username}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 italic">
                  "{report.targetPreview}"
                </p>
                <div className="text-[10px] text-slate-400">
                  Target type: <strong className="uppercase">{report.targetType}</strong> · Status:{' '}
                  <span className={report.status === 'resolved' ? 'text-emerald-500' : 'text-amber-500'}>
                    {report.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {report.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleReportAction(report.id, 'resolve')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Take Down Content
                    </button>
                    <button
                      onClick={() => handleReportAction(report.id, 'dismiss')}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Action Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
