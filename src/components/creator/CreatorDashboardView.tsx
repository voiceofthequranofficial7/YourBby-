import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  IndianRupee,
  Film,
  Sparkles,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';

export const CreatorDashboardView: React.FC = () => {
  const { analytics, currentUser } = useApp();

  if (!analytics) return null;

  const maxViews = Math.max(...analytics.chartData.map(d => d.views));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 my-2">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-indigo-500/10 rounded-3xl border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Creator Studio & Insights
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Real performance telemetry for @{currentUser?.username}. Monitor engagement, video retention, and monetized earnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Earnings</span>
            <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              ₹{analytics.estimatedEarningsINR.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Account Reach</span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {analytics.reach.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold mt-1">
            <ArrowUpRight className="w-3 h-3" /> +18.4% this week
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Impressions</span>
            <Eye className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {analytics.impressions.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold mt-1">
            <ArrowUpRight className="w-3 h-3" /> +24.1% this week
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Reels Views</span>
            <Film className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {analytics.reelViews.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold mt-1">
            <ArrowUpRight className="w-3 h-3" /> +32.0% this week
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Engagement Rate</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {analytics.engagementRate}%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold mt-1">
            <ArrowUpRight className="w-3 h-3" /> Industry benchmark: 4.2%
          </div>
        </div>
      </div>

      {/* 7-Day Performance Visualization */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Weekly Reach & Views Overview
            </h3>
            <span className="text-xs text-slate-400">Total volume over the last 7 calendar days</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Video Views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span>Engagements</span>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="h-56 pt-6 flex items-end justify-between gap-2 sm:gap-6 border-b border-slate-100 dark:border-slate-800 pb-2">
          {analytics.chartData.map((item, idx) => {
            const heightPct = Math.round((item.views / maxViews) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {item.views > 1000 ? `${(item.views / 1000).toFixed(0)}k` : item.views}
                </span>
                <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 h-full">
                  <div
                    className="w-full bg-gradient-to-t from-rose-500 to-indigo-500 rounded-lg transition-all duration-500"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {item.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monetization & Subscriptions status */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Razorpay Payouts Verified
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Your creator bank account in India is active. Bi-weekly earnings are automatically deposited in INR (₹).
            </p>
          </div>
        </div>

        <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-all shrink-0">
          Manage Payout Account
        </button>
      </div>
    </div>
  );
};
