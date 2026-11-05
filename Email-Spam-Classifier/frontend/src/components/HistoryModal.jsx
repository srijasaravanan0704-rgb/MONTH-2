import React from "react";
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Sparkles, Clock, Mail, Languages, Info } from "lucide-react";

export default function HistoryModal({ entry, onClose }) {
  if (!entry) return null;

  const isSpam = entry.prediction?.toLowerCase() === "spam";
  const spamProb = entry.spam_probability ?? (isSpam ? 0.98 : 0.02);
  const hamProb = entry.ham_probability ?? (1 - spamProb);
  const riskScore = entry.risk_score ?? Math.round(spamProb * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0b1026] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Detection Audit Log #{entry.id || "Detail"}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Header Card */}
          <div className={`p-5 rounded-xl border ${
            isSpam ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {isSpam ? (
                  <ShieldAlert className="w-8 h-8 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base sm:text-lg font-black text-white">
                      {isSpam ? "🔴 PHISHING / SPAM DETECTED" : "🟢 SAFE EMAIL VERIFIED"}
                    </h4>
                    {entry.threat_category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/30 border border-slate-700 text-slate-300">
                        {entry.threat_category}
                      </span>
                    )}
                  </div>
                  
                  {entry.sender && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{entry.sender}</span>
                    </p>
                  )}
                  
                  <p className="text-xs text-slate-300 mt-1 font-semibold">
                    {entry.subject || entry.subject_snippet || "No Subject"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-3xl font-black font-mono ${
                  riskScore >= 70 ? "text-red-400" : (riskScore >= 35 ? "text-amber-400" : "text-emerald-400")
                }`}>
                  {riskScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Risk Score</div>
              </div>
            </div>
          </div>

          {/* Tamil Summary if present */}
          {entry.tamil_summary && (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                <span>தமிழ் விளக்கம் (Tamil Summary)</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-medium">
                {entry.tamil_summary}
              </p>
            </div>
          )}

          {/* Explanation */}
          {entry.explanation && (
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Risk Determination</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {entry.explanation}
              </p>
            </div>
          )}

          {/* Keywords & Probabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Signals */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Key Detected Signals
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {entry.keywords && entry.keywords.length > 0 ? (
                  entry.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-semibold">
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Standard NLP distribution</span>
                )}
              </div>
            </div>

            {/* Model Confidence */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h5 className="text-xs font-bold text-white">Statistical Probabilities</h5>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Spam Likelihood:</span>
                  <span className="text-red-400 font-bold">{(spamProb * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Legitimate Likelihood:</span>
                  <span className="text-emerald-400 font-bold">{(hamProb * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1">
                  <span className="text-slate-400">Model Confidence:</span>
                  <span className="text-indigo-300 font-bold">{entry.confidence || 99}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Email Body Snippet if available */}
          {entry.body && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Message Body Content</span>
              <p className="font-mono text-slate-400 text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                {entry.body}
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <span>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ""}</span>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
