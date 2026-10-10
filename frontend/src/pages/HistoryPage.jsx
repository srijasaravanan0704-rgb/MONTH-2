import React, { useState } from "react";
import { History, Search, Filter, ShieldAlert, ShieldCheck, ExternalLink, Download, Trash2, Lock, Eye, EyeOff } from "lucide-react";
import HistoryModal from "../components/HistoryModal";

export default function HistoryPage({ statistics }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [saveHistoryEnabled, setSaveHistoryEnabled] = useState(true);
  const [cleared, setCleared] = useState(false);

  const defaultHistory = [
    {
      id: 1,
      subject_snippet: "Prize notification - $1,000,000 Winner",
      prediction: "spam",
      confidence: 100.0,
      spam_probability: 1.0,
      ham_probability: 0.0,
      timestamp: "2026-10-09T18:30:00",
      keywords: ["prize", "claim", "winner", "cash"]
    },
    {
      id: 2,
      subject_snippet: "Project meeting & Quarterly sync",
      prediction: "ham",
      confidence: 98.0,
      spam_probability: 0.02,
      ham_probability: 0.98,
      timestamp: "2026-10-09T17:45:00",
      keywords: ["meeting", "project", "sync"]
    },
    {
      id: 3,
      subject_snippet: "Bank verification - Account Action Required",
      prediction: "spam",
      confidence: 97.0,
      spam_probability: 0.97,
      ham_probability: 0.03,
      timestamp: "2026-10-09T16:15:00",
      keywords: ["bank", "urgent", "account", "verify"]
    },
    {
      id: 4,
      subject_snippet: "Team update and weekend schedule",
      prediction: "ham",
      confidence: 99.0,
      spam_probability: 0.01,
      ham_probability: 0.99,
      timestamp: "2026-10-09T14:20:00",
      keywords: ["team", "update", "schedule"]
    }
  ];

  const rawHistory = cleared ? [] : (
    statistics?.history && statistics.history.length > 0
      ? statistics.history
      : (statistics?.recent_predictions && statistics.recent_predictions.length > 0 ? statistics.recent_predictions : defaultHistory)
  );

  const filteredHistory = rawHistory.filter((item) => {
    const text = (item.subject || item.subject_snippet || "").toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterType === "spam") return item.prediction?.toLowerCase() === "spam";
    if (filterType === "safe") return item.prediction?.toLowerCase() === "ham";
    if (filterType === "high_risk") return (item.spam_probability || (item.prediction === "spam" ? 0.95 : 0.05)) > 0.8;

    return true;
  });

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear prediction history?")) {
      setCleared(true);
      try {
        await fetch("http://127.0.0.1:8000/clear-history", { method: "DELETE" });
      } catch (e) {
        console.log("Error clearing history:", e);
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ["ID", "Subject", "Result", "Spam_Probability%", "Risk_Score", "Timestamp"];
    const rows = filteredHistory.map(item => [
      item.id || "",
      `"${(item.subject || item.subject_snippet || "").replace(/"/g, '""')}"`,
      item.prediction?.toUpperCase() || "SPAM",
      ((item.spam_probability || 0) * 100).toFixed(1),
      Math.round((item.spam_probability || 0) * 100),
      `"${item.timestamp || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mailguard_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fadeIn">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            Detection History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse, search, export CSV, or audit previous analysis logs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Search, Filter & Privacy Toolbar */}
      <div className="white-glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        
        {/* Search & Filter Inputs */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b1026] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0b1026] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All ▼</option>
            <option value="spam">🔴 Spam Only</option>
            <option value="safe">🟢 Safe Only</option>
            <option value="high_risk">⚠ High Risk (&gt;80%)</option>
          </select>
        </div>

        {/* Privacy Toggle Controls */}
        <div className="flex items-center gap-2 text-xs text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Save history logs:</span>
          <button
            onClick={() => setSaveHistoryEnabled(!saveHistoryEnabled)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
              saveHistoryEnabled
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
          >
            {saveHistoryEnabled ? "Enabled ✓" : "Disabled ✖"}
          </button>
        </div>

      </div>

      {/* Data Table */}
      <div className="white-glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Subject</th>
                <th className="py-3.5 px-4 text-center">Result</th>
                <th className="py-3.5 px-4 text-center">Risk Score</th>
                <th className="py-3.5 px-4 text-right">Date</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, idx) => {
                  const isSpam = item.prediction?.toLowerCase() === "spam";
                  const spamProb = item.spam_probability ?? (isSpam ? 0.98 : 0.02);
                  const riskPercent = Math.round(spamProb * 100);

                  return (
                    <tr 
                      key={item.id || idx}
                      onClick={() => setSelectedEntry(item)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 font-semibold text-white max-w-xs truncate">
                        {item.subject || item.subject_snippet || "No Subject"}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black tracking-wider ${
                          isSpam 
                            ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}>
                          {isSpam ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          {isSpam ? "SPAM" : "SAFE"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold">
                        <span className={isSpam ? "text-red-400" : "text-emerald-400"}>
                          {riskPercent}%
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Today"}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button className="text-indigo-400 group-hover:text-indigo-300 font-semibold text-xs inline-flex items-center gap-1">
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No history entries found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEntry && (
        <HistoryModal 
          entry={selectedEntry} 
          onClose={() => setSelectedEntry(null)} 
        />
      )}

    </div>
  );
}
