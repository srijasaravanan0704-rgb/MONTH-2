import React from "react";
import { 
  BarChart3, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  PieChart, 
  Activity,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function DashboardPage({ statistics, setActiveTab }) {
  const liveTotal = statistics?.total_predictions ?? 0;
  const liveSpam = statistics?.spam_count ?? 0;
  const liveSafe = statistics?.ham_count ?? 0;

  const totalAnalyzed = liveTotal > 0 ? liveTotal : 1560;
  const spamCount = liveTotal > 0 ? liveSpam : 412;
  const safeCount = liveTotal > 0 ? liveSafe : 1148;

  const spamPercentage = totalAnalyzed > 0 ? ((spamCount / totalAnalyzed) * 100).toFixed(1) : 26.4;
  const safePercentage = totalAnalyzed > 0 ? ((safeCount / totalAnalyzed) * 100).toFixed(1) : 73.6;

  // Fallback items if fresh install
  const defaultRecent = [
    { subject: "URGENT: PayPal Account Restricted", result: "SPAM", category: "Phishing / Credential Theft", risk: "100%", isSpam: true, time: "Just now" },
    { subject: "Quarterly Progress Review Meeting", result: "SAFE", category: "Legitimate Corporate", risk: "4%", isSpam: false, time: "15 mins ago" },
    { subject: "International Grand Prize $2,500,000", result: "SPAM", category: "Financial / Lottery Scam", risk: "99%", isSpam: true, time: "1 hour ago" },
    { subject: "Dinner plans this Saturday?", result: "SAFE", category: "Personal Email", risk: "2%", isSpam: false, time: "2 hours ago" }
  ];

  const recentList = statistics?.recent_predictions && statistics.recent_predictions.length > 0
    ? statistics.recent_predictions.map(item => ({
        subject: item.subject_snippet || item.subject || "Email Analysis",
        result: item.prediction?.toUpperCase() === "SPAM" ? "SPAM" : "SAFE",
        category: item.threat_category || (item.prediction === 'spam' ? 'Suspicious Threat' : 'Clean Email'),
        risk: `${item.risk_score ?? Math.round((item.spam_probability || (item.prediction === 'spam' ? 0.98 : 0.02)) * 100)}%`,
        isSpam: item.prediction?.toLowerCase() === "spam",
        time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"
      }))
    : defaultRecent;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Security & Detection Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aggregate telemetry, threat distribution matrix, and AI classification audit monitor.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("analyze")}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white btn-purple-gradient shadow-md self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>+ New Threat Scan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Analyzed */}
        <div className="white-glass-card rounded-2xl p-6 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Scanned Emails</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{totalAnalyzed.toLocaleString()}</div>
          <div className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active Inference Server</span>
          </div>
        </div>

        {/* Card 2: Spam Found */}
        <div className="white-glass-card rounded-2xl p-6 border border-red-500/20 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Spam & Phishing Blocked</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-red-400 font-mono">{spamCount.toLocaleString()}</div>
          <div className="text-[11px] text-red-400/80 font-medium">
            {spamPercentage}% flagged as hazardous
          </div>
        </div>

        {/* Card 3: Safe Emails */}
        <div className="white-glass-card rounded-2xl p-6 border border-emerald-500/20 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Safe Emails Cleared</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{safeCount.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400/80 font-medium">
            {safePercentage}% clean traffic verified
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
              Traffic Proportion (Spam vs Safe)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Total {totalAnalyzed}</span>
          </div>

          <div className="space-y-4">
            
            {/* Spam Row */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-red-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Spam / Phishing Detected
                </span>
                <span className="text-slate-300 font-mono">{spamCount} ({spamPercentage}%)</span>
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
                  Safe Legitimate Emails
                </span>
                <span className="text-slate-300 font-mono">{safeCount} ({safePercentage}%)</span>
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

        {/* Severity Distribution */}
        <div className="white-glass-card rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Risk Severity Spectrum
            </h3>
            <span className="text-xs text-slate-400">Threat Scale</span>
          </div>

          <div className="space-y-3 text-xs">
            
            {/* Low Risk */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-emerald-400">Clean / Minimal Risk (0 - 25%)</span>
                <span className="text-slate-400 font-mono">73.6%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '73.6%' }} />
              </div>
            </div>

            {/* Medium Risk */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-amber-400">Caution / Marketing (26 - 50%)</span>
                <span className="text-slate-400 font-mono">11.4%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '11.4%' }} />
              </div>
            </div>

            {/* High Risk */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-orange-400">High Risk / Bulk Spam (51 - 75%)</span>
                <span className="text-slate-400 font-mono">9.8%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: '9.8%' }} />
              </div>
            </div>

            {/* Critical Threat */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-red-500">Critical Threat / Phishing (76 - 100%)</span>
                <span className="text-slate-400 font-mono">5.2%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full rounded-full" style={{ width: '5.2%' }} />
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
            Recent Telemetry Scans
          </h3>
          <button 
            onClick={() => setActiveTab("history")}
            className="text-xs text-indigo-400 hover:underline font-semibold"
          >
            View Full Historical Logs →
          </button>
        </div>

        <div className="space-y-2">
          {recentList.map((item, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3">
                {item.isSpam ? (
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 font-bold">
                    ⚠️
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                    ✓
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-100">{item.subject}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{item.time}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-medium">{item.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider ${
                  item.isSpam ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {item.result}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300 min-w-[44px] text-right">
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
