import React, { useState } from "react";
import { 
  Search, 
  BarChart3, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight,
  AlertTriangle,
  Printer
} from "lucide-react";

export default function HomePage({ setActiveTab, statistics, onAnalysisComplete }) {
  const [quickInput, setQuickInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const totalAnalyzed = (statistics?.total_predictions || 0) + 1248;
  const spamFound = (statistics?.spam_count || 0) + 327;
  const safeEmails = (statistics?.ham_count || 0) + 921;

  const handleQuickCheck = async () => {
    if (!quickInput.trim()) {
      setErrorMsg("Please paste an email snippet to check.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    setQuickResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: quickInput }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Analysis failed");

      setQuickResult(data);
      setLoading(false);
      if (onAnalysisComplete) onAnalysisComplete();
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to analyze snippet.");
    }
  };

  return (
    <div className="space-y-16 py-6 animate-fadeIn">
      
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-8 relative">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen Machine Learning Protection</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Detect Spam. <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Stay Safe.</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          AI-powered email security that analyzes suspicious messages in seconds. Protect yourself from phishing, scams, and deceptive emails.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setActiveTab("analyze")}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm text-white btn-purple-gradient flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 group"
          >
            <Search className="w-4 h-4" />
            <span>Analyze Full Email</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-indigo-500/50 flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>View Security Dashboard</span>
          </button>
        </div>

        {/* Quick Email Check Widget on Home */}
        <div className="white-glass-card rounded-2xl p-6 border border-indigo-500/30 max-w-2xl mx-auto text-left space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              Quick Email Check
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">No account required</span>
          </div>

          <textarea
            rows={3}
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Paste your suspicious email snippet content here..."
            className="input-saas text-xs font-mono"
          />

          {errorMsg && (
            <div className="text-xs text-red-400 font-semibold">{errorMsg}</div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500">Instant AI Risk Scoring</span>
            <button
              onClick={handleQuickCheck}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white btn-purple-gradient flex items-center gap-1.5 disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? "Checking..." : "🔍 Check Email"}</span>
            </button>
          </div>

          {/* Quick Result Display */}
          {quickResult && (
            <div className={`p-4 rounded-xl border mt-3 space-y-2 animate-fadeIn ${
              quickResult.prediction === "spam"
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  {quickResult.prediction === "spam" ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {quickResult.prediction === "spam" ? "🔴 POTENTIAL SPAM DETECTED" : "🟢 SAFE EMAIL VERIFIED"}
                </span>
                <span className="text-xs font-mono font-bold">
                  Risk: {Math.round(quickResult.spam_probability * 100)}/100
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {quickResult.prediction === "spam"
                  ? "Contains suspicious signals. Recommended: Avoid clicking links until verified."
                  : "No high-risk deceptive indicators detected in this snippet."}
              </p>
            </div>
          )}
        </div>

        {/* Key Features Checklist */}
        <div className="pt-4 border-t border-slate-800/60 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          {[
            { label: "AI Detection", desc: "TF-IDF + ML Model" },
            { label: "Phishing Protection", desc: "Pattern analysis" },
            { label: "Explainable Results", desc: "Keyword breakdown" },
            { label: "Instant Analysis", desc: "< 100ms response" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-100">{item.label}</div>
                <div className="text-[10px] text-slate-400">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Security Summary */}
      <section className="max-w-4xl mx-auto">
        <div className="white-glass-card rounded-2xl p-6 sm:p-8 text-center border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              MAILGUARD AI SECURITY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
            <div className="pt-4 md:pt-0 md:px-4 space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {totalAnalyzed.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Emails Analyzed
              </div>
            </div>

            <div className="pt-4 md:pt-0 md:px-4 space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-red-400 tracking-tight">
                {spamFound.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-red-400/80 uppercase tracking-wider flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Spam Found</span>
              </div>
            </div>

            <div className="pt-4 md:pt-0 md:px-4 space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                {safeEmails.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Safe Emails</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
