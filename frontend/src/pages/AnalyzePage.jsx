import React, { useState } from "react";
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  Briefcase, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles,
  Printer,
  ThumbsUp,
  ThumbsDown,
  Send
} from "lucide-react";

const SAMPLES = {
  spam: {
    label: "Spam",
    icon: Flame,
    color: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
    sender: "claim-dept@lottery-winner-hub.net",
    subject: "CONGRATULATIONS! You won $1,000,000 Cash Prize! Claim Immediately!",
    body: "Dear Customer,\n\nYou have been selected as the grand prize winner of $1,000,000! To claim your money, reply with your urgent banking details or click the link below immediately.\n\nhttp://bit.ly/claim-free-prize-now\n\nDo not delay, offer expires in 24 hours!"
  },
  safe: {
    label: "Safe",
    icon: Briefcase,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    sender: "sarah.jenkins@company.com",
    subject: "Project Sync & Quarterly Progress Review Meeting",
    body: "Hi Team,\n\nJust a reminder that our weekly project sync is scheduled for tomorrow at 10:00 AM EST. Please review the attached slide deck and bring your updates for the Q4 deliverables.\n\nBest regards,\nSarah"
  },
  phishing: {
    label: "Phishing",
    icon: CreditCard,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
    sender: "security-alert@yourbank-verification.com",
    subject: "URGENT: Your Bank Account Has Been Suspended!",
    body: "Dear Valued Customer,\n\nWe noticed suspicious login activity on your online banking account. Your account will be locked within 24 hours unless you verify your credit card credentials and SSN immediately at http://secure-bank-login-update.com"
  }
};

const ANALYSIS_PIPELINE = [
  "Preprocessing",
  "Extracting features",
  "Checking suspicious patterns",
  "Running ML model",
  "Generating risk assessment"
];

export default function AnalyzePage({ onAnalysisComplete }) {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [activeSample, setActiveSample] = useState("");

  const [loading, setLoading] = useState(false);
  const [pipelineIndex, setPipelineIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Feedback State
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackVote, setFeedbackVote] = useState(null); // true for correct, false for incorrect
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  const handleSelectSample = (key) => {
    setActiveSample(key);
    const s = SAMPLES[key];
    if (s) {
      setSender(s.sender);
      setSubject(s.subject);
      setBody(s.body);
      setErrorMsg("");
      setResult(null);
      setFeedbackSubmitted(false);
      setShowFeedbackInput(false);
    }
  };

  const handleClear = () => {
    setSender("");
    setSubject("");
    setBody("");
    setActiveSample("");
    setResult(null);
    setErrorMsg("");
    setFeedbackSubmitted(false);
    setShowFeedbackInput(false);
  };

  const handleAnalyze = async () => {
    if (!sender.trim() && !subject.trim() && !body.trim()) {
      setErrorMsg("Please provide at least a subject or email content to analyze.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setPipelineIndex(0);
    setResult(null);
    setFeedbackSubmitted(false);
    setShowFeedbackInput(false);

    const pipelineTimer = setInterval(() => {
      setPipelineIndex((prev) => {
        if (prev < ANALYSIS_PIPELINE.length - 1) return prev + 1;
        clearInterval(pipelineTimer);
        return prev;
      });
    }, 250);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, subject, body }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Prediction request failed.");

      setTimeout(() => {
        clearInterval(pipelineTimer);
        setLoading(false);
        setResult(data);
        if (onAnalysisComplete) onAnalysisComplete();
      }, 1200);

    } catch (err) {
      clearInterval(pipelineTimer);
      setLoading(false);
      setErrorMsg(err.message || "Could not connect to FastAPI server. Please check backend.");
    }
  };

  const handleSendFeedback = async (vote, text = "") => {
    setFeedbackVote(vote);
    setFeedbackSubmitted(true);
    try {
      await fetch("http://127.0.0.1:8000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_correct: vote, feedback: text }),
      });
    } catch (e) {
      console.log("Feedback submit error:", e);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4 animate-fadeIn">
      
      {/* Header & Inputs */}
      <div className="white-glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Search className="w-6 h-6 text-indigo-400" />
              Analyze an Email
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter email header details or paste body text to perform instant AI threat analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">Quick Test:</span>
            {Object.keys(SAMPLES).map((key) => {
              const sample = SAMPLES[key];
              const Icon = sample.icon;
              const isSelected = activeSample === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectSample(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isSelected ? "ring-2 ring-indigo-500 " + sample.color : sample.color
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sample.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sender Email
            </label>
            <input
              type="email"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. sender@suspicious-domain.com"
              className="input-saas"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. URGENT: Account Suspension Notice"
              className="input-saas"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Content
            </label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste your email content here..."
              className="input-saas resize-y font-mono text-xs"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white btn-purple-gradient flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Analyzing Email..." : "Analyze Email"}</span>
            </button>

            {(sender || subject || body) && (
              <button
                onClick={handleClear}
                disabled={loading}
                className="px-4 py-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Pipeline */}
      {loading && (
        <div className="white-glass-card rounded-2xl p-6 border border-indigo-500/30 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
              Analyzing email...
            </span>
            <span>Step {pipelineIndex + 1} of 5</span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${((pipelineIndex + 1) / ANALYSIS_PIPELINE.length) * 100}%` }}
            />
          </div>

          <div className="space-y-2 pt-2">
            {ANALYSIS_PIPELINE.map((step, idx) => {
              const isDone = idx < pipelineIndex;
              const isCurrent = idx === pipelineIndex;
              return (
                <div 
                  key={idx}
                  className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                    isDone ? "text-emerald-400" : isCurrent ? "text-indigo-300 font-bold" : "text-slate-600"
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${isDone ? "text-emerald-400" : isCurrent ? "text-indigo-400 animate-pulse" : "text-slate-700"}`} />
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESULT SECTION */}
      {result && !loading && (
        <div className="space-y-6 animate-fadeIn print:text-black">
          
          {/* Main Risk Card */}
          <div className={`rounded-2xl p-6 sm:p-8 border transition-all ${
            result.prediction === "spam" ? "glow-spam-card" : "glow-safe-card"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm"
                  style={{
                    backgroundColor: result.prediction === "spam" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                    color: result.prediction === "spam" ? "#f87171" : "#34d399",
                    border: `1px solid ${result.prediction === "spam" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`
                  }}
                >
                  {result.prediction === "spam" ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{result.prediction === "spam" ? "🔴 POTENTIAL SPAM / HIGH RISK" : "🟢 SAFE EMAIL VERIFIED"}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {result.prediction === "spam" ? "Phishing / Spam Detected" : "Safe Email Verified"}
                </h3>
                
                <p className="text-xs text-slate-300">
                  {result.prediction === "spam"
                    ? "This email contains suspicious patterns. Proceed with caution."
                    : "No major threat patterns detected in this message."}
                </p>
              </div>

              {/* Score Meter */}
              <div className="bg-[#0b1026]/90 p-5 rounded-xl border border-slate-800 text-center min-w-[200px] space-y-3">
                <div className="text-xs uppercase font-bold text-slate-400">Risk Score</div>
                <div className="text-4xl font-black text-white">
                  {Math.round(result.spam_probability * 100)} <span className="text-sm font-normal text-slate-400">/ 100</span>
                </div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      result.prediction === "spam" ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-gradient-to-r from-teal-500 to-emerald-500"
                    }`}
                    style={{ width: `${Math.max(5, Math.round(result.spam_probability * 100))}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-semibold pt-1 border-t border-slate-800">
                  <span className="text-red-400">Spam: {(result.spam_probability * 100).toFixed(1)}%</span>
                  <span className="text-emerald-400">Safe: {(result.ham_probability * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Print Security Report Button */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-end print:hidden">
              <button 
                onClick={handlePrintReport}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export / Print PDF Report</span>
              </button>
            </div>
          </div>

          {/* Explainable AI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="white-glass-card rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                WHY WAS IT FLAGGED?
              </h4>

              <div className="space-y-2.5 text-xs text-slate-300">
                {result.prediction === "spam" ? (
                  <>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                      <span className="font-bold">✓</span>
                      <span>Suspicious prize-related language</span>
                    </div>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                      <span className="font-bold">✓</span>
                      <span>Urgent request & pressure tactic</span>
                    </div>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                      <span className="font-bold">✓</span>
                      <span>Unusual financial offer or credential verification</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      <span className="font-bold">✓</span>
                      <span>Standard conversational structure</span>
                    </div>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      <span className="font-bold">✓</span>
                      <span>No suspicious shortener links</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="white-glass-card rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                RECOMMENDED ACTION
              </h4>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 font-medium space-y-1">
                {result.prediction === "spam" ? (
                  <p>Avoid clicking links or downloading attachments until you verify the sender through an official channel.</p>
                ) : (
                  <p>Standard safety precautions apply for routine email correspondence.</p>
                )}
              </div>

              {/* Signals */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Detected Keyword Signals</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords && result.keywords.length > 0 ? (
                    result.keywords.map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-semibold">
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No specific high-risk keywords</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Feedback System Component */}
          <div className="white-glass-card rounded-2xl p-6 space-y-4 border border-slate-800 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Was this result helpful?</h4>
                <p className="text-[11px] text-slate-400">Help improve model accuracy auditing by submitting feedback.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendFeedback(true)}
                  disabled={feedbackSubmitted}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    feedbackSubmitted && feedbackVote === true
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-md"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>👍 Correct</span>
                </button>

                <button
                  onClick={() => {
                    handleSendFeedback(false);
                    setShowFeedbackInput(true);
                  }}
                  disabled={feedbackSubmitted && feedbackVote === false && !showFeedbackInput}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    feedbackSubmitted && feedbackVote === false
                      ? "bg-red-500 text-white border-red-400 shadow-md"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
                  <span>👎 Incorrect</span>
                </button>
              </div>
            </div>

            {/* Optional text feedback box */}
            {showFeedbackInput && (
              <div className="pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
                <textarea
                  rows={2}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Tell us what was wrong with this prediction..."
                  className="input-saas text-xs"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>* Feedback logs are saved for training workflow audit. Model retrains offline.</span>
                  <button
                    onClick={() => {
                      handleSendFeedback(feedbackVote, feedbackNotes);
                      setShowFeedbackInput(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold flex items-center gap-1 hover:bg-indigo-500"
                  >
                    <Send className="w-3 h-3" />
                    <span>Submit Feedback</span>
                  </button>
                </div>
              </div>
            )}

            {feedbackSubmitted && !showFeedbackInput && (
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Thank you! Your feedback has been recorded for model audit logging.</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
