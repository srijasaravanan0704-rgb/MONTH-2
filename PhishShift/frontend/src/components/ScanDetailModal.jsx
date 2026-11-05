import React from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ExternalLink,
  Flame,
  Lock,
  DollarSign,
  Info
} from 'lucide-react';

export default function ScanDetailModal({ scan, onClose }) {
  if (!scan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                scan.risk_category === 'Higher Risk'
                  ? 'bg-rose-500 text-white'
                  : scan.risk_category === 'Needs Review'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {scan.risk_category === 'Higher Risk' && <ShieldAlert className="w-5 h-5" />}
              {scan.risk_category === 'Needs Review' && <AlertTriangle className="w-5 h-5" />}
              {scan.risk_category === 'Lower Risk' && <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-500">{scan.scan_id || scan.id}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {scan.channel}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Scan Assessment Details
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
          {/* Risk Overview Grid */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-slate-400 block text-[11px]">Outcome</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {scan.risk_category}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Risk Probability</span>
              <span className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
                {(scan.risk_score * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Model Applied</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                {(scan.model_used || 'Linear SVM').replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Subject & Body */}
          {scan.subject && (
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject:</span>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {scan.subject}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Message Content:</span>
              {!scan.stored_full_body && (
                <span className="text-[10px] text-amber-500 font-medium">
                  Privacy default: Stored as truncated preview
                </span>
              )}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-mono text-[11px] leading-relaxed border border-slate-200 dark:border-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {scan.full_body || scan.body_preview}
            </div>
          </div>

          {/* Feature Attributions if present */}
          {scan.feature_attributions && scan.feature_attributions.length > 0 && (
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Vocabulary Attribution Weights:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scan.feature_attributions.map((feat, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded text-[11px] font-mono border ${
                      feat.direction === 'increases_risk'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
                    }`}
                  >
                    "{feat.feature}": {feat.weight.toFixed(3)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inert Defanged URLs */}
          {scan.inert_urls && scan.inert_urls.length > 0 && (
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Detected Inert URLs:
              </span>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                {scan.inert_urls.map((u, i) => (
                  <div key={i} className="truncate">&bull; {u}</div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {scan.recommendations && scan.recommendations.length > 0 && (
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Safety Guidance:
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc pl-4 text-[11px]">
                {scan.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
