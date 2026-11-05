import React, { useState } from "react";
import { History, Search, Filter, ShieldAlert, ShieldCheck, ExternalLink, Download, Trash2, Lock, Eye, EyeOff, Database } from "lucide-react";
import HistoryModal from "../components/HistoryModal";
import { API_BASE_URL } from "../services/api";

export default function HistoryPage({ statistics }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [saveHistoryEnabled, setSaveHistoryEnabled] = useState(true);
  const [cleared, setCleared] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 25;

  const defaultHistory = [
    {
      id: 1,
      sender: "claims-dept@lottery-winner-hub.net",
      subject: "Prize notification - $1,000,000 Winner",
      threat_category: "Financial / Lottery Scam",
      prediction: "spam",
      confidence: 100.0,
      risk_score: 100,
      spam_probability: 1.0,
      ham_probability: 0.0,
      timestamp: "2026-10-09T18:30:00",
      keywords: ["prize", "claim", "winner", "cash"]
    },
    {
      id: 2,
      sender: "sarah.jenkins@company.com",
      subject: "Project meeting & Quarterly sync",
      threat_category: "Legitimate Corporate",
      prediction: "ham",
      confidence: 98.0,
      risk_score: 4,
      spam_probability: 0.02,
      ham_probability: 0.98,
      timestamp: "2026-10-09T17:45:00",
      keywords: ["meeting", "project", "sync"]
    }
  ];

  const rawHistory = cleared ? [] : (
    statistics?.history && statistics.history.length > 0
      ? statistics.history
      : (statistics?.recent_predictions && statistics.recent_predictions.length > 0 ? statistics.recent_predictions : defaultHistory)
  );

  const filteredHistory = rawHistory.filter((item) => {
    const text = `${item.subject || item.subject_snippet || ""} ${item.sender || ""} ${item.threat_category || ""}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterType === "spam") return item.prediction?.toLowerCase() === "spam";
    if (filterType === "safe") return item.prediction?.toLowerCase() === "ham";
    if (filterType === "high_risk") return (item.risk_score ?? Math.round((item.spam_probability || 0) * 100)) >= 70;
    if (filterType === "phishing") return item.threat_category?.toLowerCase().includes("phish");

    return true;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const pagedHistory = filteredHistory.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear prediction history?")) {
      setCleared(true);
      try {
        await fetch(`${API_BASE_URL}/clear-history`, { method: "DELETE" });
      } catch (e) {
        console.log("Error clearing history:", e);
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ["ID", "Sender", "Subject", "Category", "Verdict", "Risk_Score", "Spam_Probability%", "Timestamp"];
    const rows = filteredHistory.map(item => [
      item.id || "",
      `"${(item.sender || "").replace(/"/g, '""')}"`,
      `"${(item.subject || item.subject_snippet || "").replace(/"/g, '""')}"`,
      `"${(item.threat_category || "N/A").replace(/"/g, '""')}"`,
      item.prediction?.toUpperCase() || "SPAM",
      item.risk_score ?? Math.round((item.spam_probability || 0) * 100),
      ((item.spam_probability || 0) * 100).toFixed(1),
      `"${item.timestamp || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mailguard_dataset_500_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fadeIn">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-400" />
              <span>Historical Detection Telemetry</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {rawHistory.length} Emails
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse, search across {rawHistory.length} analyzed emails, inspect multi-factor threat vectors, or export CSV.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV ({filteredHistory.length})</span>
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
        <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by subject, sender, or category..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
              className="w-full bg-[#0b1026] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(0); }}
            className="bg-[#0b1026] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Verdicts ▼</option>
            <option value="spam">🔴 Spam / Phishing</option>
            <option value="safe">🟢 Clean / Safe Only</option>
            <option value="high_risk">⚠️ High Risk (&ge;70%)</option>
            <option value="phishing">🎯 Phishing Vector</option>
          </select>
        </div>

        {/* Privacy Toggle Controls */}
        <div className="flex items-center gap-2 text-xs text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4 shrink-0">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Audit Logging:</span>
          <button
            onClick={() => setSaveHistoryEnabled(!saveHistoryEnabled)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
              saveHistoryEnabled
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
          >
            {saveHistoryEnabled ? "Active ✓" : "Paused ✖"}
          </button>
        </div>

      </div>

      {/* Data Table */}
      <div className="white-glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Sender & Subject</th>
                <th className="py-3.5 px-4 text-center">Verdict</th>
                <th className="py-3.5 px-4 text-center">Risk Score</th>
                <th className="py-3.5 px-4 text-right">Audit Date</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {pagedHistory.length > 0 ? (
                pagedHistory.map((item, idx) => {
                  const isSpam = item.prediction?.toLowerCase() === "spam";
                  const spamProb = item.spam_probability ?? (isSpam ? 0.98 : 0.02);
                  const riskPercent = item.risk_score ?? Math.round(spamProb * 100);

                  return (
                    <tr 
                      key={item.id || idx}
                      onClick={() => setSelectedEntry(item)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group font-sans"
                    >
                      <td className="py-3.5 px-6 max-w-sm">
                        <div className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                          {item.subject || item.subject_snippet || "No Subject"}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono truncate">
                          {item.sender && <span className="truncate">{item.sender}</span>}
                          {item.threat_category && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 font-sans">{item.threat_category}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-sans">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                          isSpam 
                            ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}>
                          {isSpam ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          {isSpam ? "SPAM" : "SAFE"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className={riskPercent >= 70 ? "text-red-400" : (riskPercent >= 35 ? "text-amber-400" : "text-emerald-400")}>
                          {riskPercent}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Recently"}
                      </td>

                      <td className="py-3.5 px-6 text-right font-sans">
                        <button className="text-indigo-400 group-hover:text-indigo-300 font-semibold text-xs inline-flex items-center gap-1">
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-sans">
                    No history entries found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-sans">
            <div>
              Showing <span className="font-bold text-white">{currentPage * itemsPerPage + 1}</span> to{" "}
              <span className="font-bold text-white">{Math.min(filteredHistory.length, (currentPage + 1) * itemsPerPage)}</span> of{" "}
              <span className="font-bold text-white">{filteredHistory.length}</span> emails
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors text-xs font-semibold"
              >
                Previous
              </button>
              <span className="text-xs font-mono text-slate-300">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors text-xs font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
