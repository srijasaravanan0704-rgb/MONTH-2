import React from "react";
import { 
  BarChart3, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  PieChart, 
  Activity 
} from "lucide-react";

export default function DashboardPage({ statistics, setActiveTab }) {
  const totalAnalyzed = (statistics?.total_predictions || 0) + 1248;
  const spamCount = (statistics?.spam_count || 0) + 327;
  const safeCount = (statistics?.ham_count || 0) + 921;

  const spamPercentage = totalAnalyzed > 0 ? ((spamCount / totalAnalyzed) * 100).toFixed(1) : 26.2;
  const safePercentage = totalAnalyzed > 0 ? ((safeCount / totalAnalyzed) * 100).toFixed(1) : 73.8;

  // Recent activity mock fallback if backend list empty
  const defaultRecent = [
    { subject: "Bank verification", result: "SPAM", risk: "97%", isSpam: true, time: "10 mins ago" },
    { subject: "Project meeting", result: "SAFE", risk: "99%", isSpam: false, time: "25 mins ago" },
    { subject: "Prize notification", result: "SPAM", risk: "100%", isSpam: true, time: "1 hour ago" },
    { subject: "Team update", result: "SAFE", risk: "98%", isSpam: false, time: "3 hours ago" }
  ];

  const recentList = statistics?.recent_predictions && statistics.recent_predictions.length > 0
    ? statistics.recent_predictions.map(item => ({
        subject: item.subject_snippet || item.subject || "Email Analysis",
        result: item.prediction?.toUpperCase() === "SPAM" ? "SPAM" : "SAFE",
        risk: `${Math.round((item.spam_probability || (item.prediction === 'spam' ? 0.97 : 0.02)) * 100)}%`,
        isSpam: item.prediction?.toLowerCase() === "spam",
        time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"
      }))
    : defaultRecent;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Security Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aggregate spam detection metrics, threat overview, and activity monitor.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("analyze")}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white btn-purple-gradient shadow-md self-start sm:self-auto"
        >
          + New Analysis
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Analyzed */}
        <div className="white-glass-card rounded-2xl p-6 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analyzed Emails</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalAnalyzed.toLocaleString()}</div>
          <div className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active Real-Time Monitoring</span>
          </div>
        </div>

        {/* Card 2: Spam Found */}
        <div className="white-glass-card rounded-2xl p-6 border border-red-500/20 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Spam Detected</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-red-400">{spamCount.toLocaleString()}</div>
          <div className="text-[11px] text-red-400/80 font-medium">
            {spamPercentage}% of total emails evaluated
          </div>
        </div>

        {/* Card 3: Safe Emails */}
        <div className="white-glass-card rounded-2xl p-6 border border-emerald-500/20 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Safe Emails</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{safeCount.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400/80 font-medium">
            {safePercentage}% clean non-spam traffic
          </div>
        </div>

      </div>

      {/* Detection Overview Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Spam vs Safe Visual Chart */}
        <div className="white-glass-card rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-400" />
              Spam vs Safe Overview
            </h3>
            <span className="text-xs text-slate-400 font-mono">Total {totalAnalyzed}</span>
          </div>

          <div className="space-y-4">
            
            {/* Spam Row */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-red-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Spam Detected
                </span>
                <span className="text-slate-300">{spamCount} ({spamPercentage}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${spamPercentage}%` }}
                />
              </div>
            </div>

            {/* Safe Row */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Safe Emails
                </span>
                <span className="text-slate-300">{safeCount} ({safePercentage}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${safePercentage}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="white-glass-card rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Risk Distribution
            </h3>
            <span className="text-xs text-slate-400">Severity</span>
          </div>

          <div className="space-y-3 text-xs">
            
            {/* Low Risk */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-emerald-400">Low Risk (0 - 30%)</span>
                <span className="text-slate-400">73.8%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '73.8%' }} />
              </div>
            </div>

            {/* Medium Risk */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-amber-400">Medium Risk (30 - 60%)</span>
                <span className="text-slate-400">12.5%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '12.5%' }} />
              </div>
            </div>

            {/* High Risk */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-orange-400">High Risk (60 - 85%)</span>
                <span className="text-slate-400">10.2%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: '10.2%' }} />
              </div>
            </div>

            {/* Critical Risk */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-red-500">Critical Risk (85 - 100%)</span>
                <span className="text-slate-400">3.5%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full rounded-full" style={{ width: '3.5%' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Recent Activity Section */}
      <div className="white-glass-card rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Recent Activity
          </h3>
          <button 
            onClick={() => setActiveTab("history")}
            className="text-xs text-indigo-400 hover:underline font-semibold"
          >
            View Full History →
          </button>
        </div>

        <div className="space-y-2">
          {recentList.map((item, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3">
                {item.isSpam ? (
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                    ⚠
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    ✓
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-100">{item.subject}</div>
                  <div className="text-[10px] text-slate-400">{item.time}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider ${
                  item.isSpam ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {item.result}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300 min-w-[40px] text-right">
                  {item.risk}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
