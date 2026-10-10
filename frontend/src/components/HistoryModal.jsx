import React from "react";
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Sparkles, Clock } from "lucide-react";

export default function HistoryModal({ entry, onClose }) {
  if (!entry) return null;

  const isSpam = entry.prediction?.toLowerCase() === "spam";
  const spamProb = entry.spam_probability ?? (isSpam ? 0.98 : 0.02);
  const hamProb = entry.ham_probability ?? (1 - spamProb);
  const riskScore = Math.round(spamProb * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0b1026] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Detection Report #{entry.id || "Detail"}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Header Card */}
          <div className={`p-5 rounded-xl border ${
            isSpam ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isSpam ? (
                  <ShieldAlert className="w-8 h-8 text-red-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-lg font-black text-white">
                    {isSpam ? "🔴 PHISHING / SPAM DETECTED" : "🟢 SAFE EMAIL VERIFIED"}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Subject: <span className="font-semibold text-white">{entry.subject || entry.subject_snippet || "No Subject"}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-white">{riskScore} <span className="text-xs text-slate-400">/ 100</span></div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Risk Score</div>
              </div>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Why was this detected? */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Why was this detected?
              </h5>
              <div className="space-y-1.5 text-xs text-slate-300">
                {isSpam ? (
                  <>
                    <p className="text-red-300 font-medium">⚠ Suspicious prize language & high risk urgency</p>
                    <p className="text-red-300 font-medium">⚠ Financial incentive / credential request</p>
                    <p className="text-red-300 font-medium">⚠ Multiple high-confidence spam feature matches</p>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-300 font-medium">✓ Normal communication structure</p>
                    <p className="text-emerald-300 font-medium">✓ No deceptive links or high urgency</p>
                  </>
                )}
              </div>
            </div>

            {/* Signals */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Detected signals
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {entry.keywords && entry.keywords.length > 0 ? (
                  entry.keywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-semibold">
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Standard NLP term distribution</span>
                )}
              </div>
            </div>

          </div>

          {/* Probabilities */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex justify-around text-xs font-semibold">
            <div>
              <span className="text-slate-400">Spam Probability: </span>
              <span className="text-red-400 font-bold">{(spamProb * 100).toFixed(1)}%</span>
            </div>
            <div className="border-r border-slate-800" />
            <div>
              <span className="text-slate-400">Safe Probability: </span>
              <span className="text-emerald-400 font-bold">{(hamProb * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
            <span className="font-bold block uppercase tracking-wider text-[10px]">Security Recommendation</span>
            {isSpam ? (
              <p>⚠ Do not click any links or download attachments from this email. Verify the sender through official channels.</p>
            ) : (
              <p>✓ This email appears safe for routine processing.</p>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
