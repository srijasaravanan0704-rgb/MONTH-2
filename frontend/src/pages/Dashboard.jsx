import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  History,
  Zap,
  ArrowRight,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardSummary();
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard telemetry. Please ensure the backend server is active.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading telemetry & model metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          Dashboard Unavailable
        </h3>
        <p className="text-sm">{error || 'Data could not be retrieved.'}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    total_scans,
    high_risk_count,
    medium_risk_count,
    low_risk_count,
    needs_review_count,
    risk_distribution,
    recent_scans,
    model_performance_summary,
    educational_notice
  } = data;

  const chartData = risk_distribution && risk_distribution.some(d => d.count > 0)
    ? risk_distribution
    : [
        { category: 'Higher Risk', count: 0, color: '#EF4444' },
        { category: 'Needs Review', count: 0, color: '#F59E0B' },
        { category: 'Lower Risk', count: 0, color: '#10B981' }
      ];

  return (
    <div className="space-y-6">
      {/* Educational Banner Callout */}
      <div className="p-4 rounded-xl bg-cyan-950/10 dark:bg-cyan-950/30 border border-cyan-500/20 text-cyan-900 dark:text-cyan-200 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold text-cyan-700 dark:text-cyan-300">Decision Support Notice: </span>
          {educational_notice}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm card-hover">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
            <span>Total Messages Analyzed</span>
            <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {total_scans}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Historical stored message scans</p>
        </div>

        {/* High Risk Detected */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-900/40 shadow-sm card-hover">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-medium mb-2">
            <span>High Risk Detected</span>
            <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {high_risk_count}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Severe phishing or credential threats</p>
        </div>

        {/* Needs Review / Medium */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 shadow-sm card-hover">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-medium mb-2">
            <span>Needs Manual Review</span>
            <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
            {medium_risk_count}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Moderate probability or conflicting clues</p>
        </div>

        {/* Lower Risk */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm card-hover">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-2">
            <span>Lower Risk Messages</span>
            <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {low_risk_count}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Standard business communications</p>
        </div>
      </div>

      {/* QUICK CTA + CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Risk Distribution</h2>
            <p className="text-xs text-slate-500">Live breakdown of analyzed messages</p>
          </div>

          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            {total_scans === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No scans recorded yet.<br />Run your first scan to view telemetry.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="category"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Scan Callout Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 text-white border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Machine Learning Model Ready
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
              Analyze a Suspicious Email or SMS
            </h2>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed mb-6">
              Evaluate inbound emails and SMS alerts through calibrated TF-IDF Linear SVM and transparent rule indicators. Inspect urgency cues, credential requests, and word-level risk attributions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/scanner')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
            >
              Open Message Scanner
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/insights')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-medium text-sm transition-all cursor-pointer"
            >
              Inspect Model Metrics
            </button>
          </div>
        </div>
      </div>

      {/* RECENT SCANS TABLE & MODEL SNAPSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Scans (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Recent Message Scans</h2>
              <p className="text-xs text-slate-500">Latest analysis records from SQLite</p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recent_scans.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No scans performed yet. Try scanning a sample message!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Message ID</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Subject / Preview</th>
                    <th className="py-2.5 px-3">Risk Category</th>
                    <th className="py-2.5 px-3 text-right">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recent_scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {scan.id}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {scan.channel}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[200px] truncate text-slate-800 dark:text-slate-200">
                        {scan.subject || scan.body_preview}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${
                            scan.risk_category === 'Higher Risk'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : scan.risk_category === 'Needs Review'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {scan.risk_category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        {(scan.risk_score * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Model Evaluation Snapshot (1 col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white">Trained Models Snapshot</h2>
                <p className="text-xs text-slate-500">Holdout evaluation metrics</p>
              </div>
              <TrendingUp className="w-4 h-4 text-cyan-500" />
            </div>

            <div className="space-y-3">
              {model_performance_summary && Object.keys(model_performance_summary).length > 0 ? (
                Object.entries(model_performance_summary).map(([key, data]) => {
                  const holdout = data.campaign_holdout || data.validation || {};
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        <span className="capitalize">{key.replace('_', ' ')}</span>
                        <span className="text-cyan-600 dark:text-cyan-400">
                          {holdout.accuracy ? `${(holdout.accuracy * 100).toFixed(1)}% Acc` : 'Evaluated'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Prec: {holdout.precision ? (holdout.precision * 100).toFixed(1) : 0}%</span>
                        <span>Rec: {holdout.recall ? (holdout.recall * 100).toFixed(1) : 0}%</span>
                        <span>F1: {holdout.f1_score ? (holdout.f1_score * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">Loading holdout metrics...</p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/insights')}
            className="w-full mt-4 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors text-center cursor-pointer"
          >
            Explore Confusion Matrix & PR Curves &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
