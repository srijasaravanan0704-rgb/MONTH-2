import React, { useState } from "react";
import { 
  Search, 
  Shield,
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
  Send,
  Link2,
  Mail,
  Copy,
  Check,
  Globe,
  FileText,
  AlertOctagon,
  ArrowRight,
  Package,
  Tv,
  Coffee,
  Languages,
  Database,
  BookOpen
} from "lucide-react";
import { API_BASE_URL } from "../services/api";
import SampleLibraryModal from "../components/SampleLibraryModal";

const SAMPLES = {
  paypal_phishing: {
    label: "Bank Phishing",
    category: "Phishing",
    icon: CreditCard,
    color: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
    sender: "security-alert@paypal-login-update.xyz",
    subject: "URGENT: Your PayPal Account Has Been Suspended!",
    body: "Dear Customer,\n\nWe detected suspicious login activity from an unknown IP address. Your account has been temporarily restricted.\n\nTo restore your account and verify your credit card details, click the link below within 24 hours:\nhttp://bit.ly/paypal-secure-verify-account\n\nFailure to verify will result in permanent account termination.\n\nPayPal Security Team"
  },
  lottery_scam: {
    label: "Lottery Scam",
    category: "Financial",
    icon: Flame,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
    sender: "winner-dept@international-lottery-hub.org",
    subject: "CONGRATULATIONS! You won $2,500,000 Cash Prize! Claim Immediately!",
    body: "Dear Lucky Beneficiary,\n\nYou have been chosen as the grand prize winner of $2,500,000 cash in our annual international lottery!\n\nTo claim your prize, send your bank account details, full name, and copy of ID to claims-dept@lottery-hub.org. Wire transfer fee of $150 must be paid before release.\n\nClaim now before funds expire!\nLottery Commission"
  },
  delivery_scam: {
    label: "Fake Delivery",
    category: "Delivery Scam",
    icon: Package,
    color: "bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20",
    sender: "notification@dhl-express-tracking.top",
    subject: "Delivery Alert: Package #DH-892147 Pending - Unpaid Customs Fee",
    body: "Hello Customer,\n\nYour shipment with tracking number DH-892147 is currently held at our regional distribution hub due to an unpaid customs fee of $3.99.\n\nPlease update your shipping address and pay the fee online immediately to avoid return to sender:\nhttp://dhl-express-reschedule-fee.top/pay\n\nDHL Express Delivery Service"
  },
  netflix_scam: {
    label: "Netflix Alert",
    category: "Billing Phishing",
    icon: Tv,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20",
    sender: "billing-support@netflix-account-center.com",
    subject: "Action Required: Your Netflix Membership Is On Hold",
    body: "Hi Member,\n\nWe were unable to process your monthly payment for Netflix. Your membership will be canceled unless you update your credit card or billing details within 12 hours.\n\nUpdate your billing information here:\nhttp://tinyurl.com/netflix-billing-update-now\n\nThanks,\nThe Netflix Team"
  },
  safe_work: {
    label: "Safe Corporate",
    category: "Legitimate",
    icon: Briefcase,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    sender: "sarah.jenkins@company.com",
    subject: "Project Sync & Quarterly Progress Review Meeting",
    body: "Hi Team,\n\nJust a reminder that our weekly project sync is scheduled for tomorrow at 10:00 AM EST. Please review the attached slide deck and bring your updates for the Q4 deliverables.\n\nLet me know if anyone has conflicts.\n\nBest regards,\nSarah"
  },
  safe_personal: {
    label: "Safe Personal",
    category: "Legitimate",
    icon: Coffee,
    color: "bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20",
    sender: "priya.kumar@gmail.com",
    subject: "Dinner plans this Saturday?",
    body: "Hey Srija,\n\nHope you are having a wonderful week! Are you free to meet up for dinner this Saturday around 7 PM? Let me know if that works or if another time suits you better.\n\nTalk soon,\nPriya"
  }
};

const ANALYSIS_PIPELINE = [
  "Preprocessing & Token Normalization",
  "Sender Domain & Brand Spoofing Check",
  "URL & Deep Link Security Inspection",
  "Urgency & Psychological Coercion Scan",
  "TF-IDF Machine Learning Classification",
  "Generating Multi-Factor Security Verdict"
];

export default function AnalyzePage({ onAnalysisComplete }) {
  const [inputMode, setInputMode] = useState("form"); // "form" | "raw"
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [rawEmailText, setRawEmailText] = useState("");
  const [activeSample, setActiveSample] = useState("");

  const [loading, setLoading] = useState(false);
  const [pipelineIndex, setPipelineIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [languageMode, setLanguageMode] = useState("bilingual"); // "bilingual" | "english" | "tamil"
  const [isSampleLibraryOpen, setIsSampleLibraryOpen] = useState(false);

  // Feedback State
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackVote, setFeedbackVote] = useState(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  // Helper to parse raw email / headers
  const handleParseRawEmail = (raw) => {
    let parsedSender = "";
    let parsedSubject = "";
    let parsedBody = raw;

    const lines = raw.split("\n");
    let bodyStartIndex = 0;
    let inHeader = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (inHeader) {
        if (line.trim() === "") {
          inHeader = false;
          bodyStartIndex = i + 1;
          continue;
        }
        const fromMatch = line.match(/^from:\s*(.+)$/i);
        if (fromMatch) parsedSender = fromMatch[1].trim();

        const subjMatch = line.match(/^subject:\s*(.+)$/i);
        if (subjMatch) parsedSubject = subjMatch[1].trim();
      }
    }

    if (!inHeader && bodyStartIndex < lines.length) {
      parsedBody = lines.slice(bodyStartIndex).join("\n").trim();
    }

    setSender(parsedSender);
    setSubject(parsedSubject);
    setBody(parsedBody);
  };

  const handleSelectSample = (key) => {
    setActiveSample(key);
    const s = SAMPLES[key];
    if (s) {
      setSender(s.sender);
      setSubject(s.subject);
      setBody(s.body);
      setRawEmailText(`From: ${s.sender}\nSubject: ${s.subject}\n\n${s.body}`);
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
    setRawEmailText("");
    setActiveSample("");
    setResult(null);
    setErrorMsg("");
    setFeedbackSubmitted(false);
    setShowFeedbackInput(false);
  };

  const handleAnalyze = async () => {
    let currentSender = sender;
    let currentSubject = subject;
    let currentBody = body;

    if (inputMode === "raw" && rawEmailText.trim()) {
      handleParseRawEmail(rawEmailText);
      currentSender = sender || "";
      currentSubject = subject || "";
      currentBody = body || rawEmailText;
    }

    if (!currentSender.trim() && !currentSubject.trim() && !currentBody.trim()) {
      setErrorMsg("Please enter email details or select a quick test sample.");
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
    }, 220);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: currentSender,
          subject: currentSubject,
          body: currentBody
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Prediction request failed.");

      setTimeout(() => {
        clearInterval(pipelineTimer);
        setLoading(false);
        setResult(data);
        if (onAnalysisComplete) onAnalysisComplete();
      }, 1000);

    } catch (err) {
      clearInterval(pipelineTimer);
      setLoading(false);
      setErrorMsg(err.message || "Could not connect to backend server.");
    }
  };

  const handleSendFeedback = async (vote, text = "") => {
    setFeedbackVote(vote);
    setFeedbackSubmitted(true);
    try {
      await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_correct: vote, feedback: text }),
      });
    } catch (e) {
      console.log("Feedback submit error:", e);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const text = `--- MailGuard AI Email Security Report ---
Verdict: ${result.prediction.toUpperCase()} (${result.threat_level || 'Safe'})
Threat Category: ${result.threat_category || 'N/A'}
Risk Score: ${result.risk_score ?? Math.round(result.spam_probability * 100)}/100
Spam Probability: ${(result.spam_probability * 100).toFixed(1)}%
Urgency Level: ${result.urgency_level || 'None'}
Explanation: ${result.explanation}
Tamil Summary: ${result.tamil_summary || 'N/A'}
Analyzed at: ${new Date(result.timestamp).toLocaleString()}
-------------------------------------------`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "text-red-400 border-red-500/40 bg-red-500/10";
    if (score >= 45) return "text-orange-400 border-orange-500/40 bg-orange-500/10";
    if (score >= 20) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
  };

  const getScoreGradient = (score) => {
    if (score >= 75) return "bg-gradient-to-r from-orange-500 via-rose-500 to-red-600";
    if (score >= 45) return "bg-gradient-to-r from-amber-400 to-orange-500";
    if (score >= 20) return "bg-gradient-to-r from-cyan-400 to-amber-400";
    return "bg-gradient-to-r from-teal-400 to-emerald-500";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fadeIn">
      
      {/* Header & Mode Switcher */}
      <div className="white-glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Search className="w-6 h-6 text-indigo-400" />
              <span>Deep Email Security Analyzer</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Multi-layer inspection: ML classification, brand spoofing, URL threat intelligence & heuristic risk scoring.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#0b1026] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setInputMode("form")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                inputMode === "form" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Standard Form</span>
            </button>
            <button
              onClick={() => setInputMode("raw")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                inputMode === "raw" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Headers / EML</span>
            </button>
          </div>
        </div>

        {/* Quick Test Presets & 500 Dataset Library Button */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Quick Presets or 500 Dataset Library:
            </span>
            <button
              type="button"
              onClick={() => setIsSampleLibraryOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md hover:scale-105 self-start sm:self-auto"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Explore 500 Sample Dataset Library 📚</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {Object.keys(SAMPLES).map((key) => {
              const sample = SAMPLES[key];
              const Icon = sample.icon;
              const isSelected = activeSample === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectSample(key)}
                  className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    isSelected ? "ring-2 ring-indigo-500 shadow-md " + sample.color : sample.color
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-mono uppercase px-1 rounded bg-black/30 font-bold">
                      {sample.category}
                    </span>
                  </div>
                  <div className="text-xs font-bold truncate">{sample.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Form Fields */}
        {inputMode === "form" ? (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sender Address (Optional)</span>
                </label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="e.g. security-alert@paypal-update.xyz"
                  className="input-saas"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subject Line</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. URGENT: Your Account Has Been Locked!"
                  className="input-saas"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Content / Body Text
              </label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste the email message body here. Links, sender notices, and message text will be scanned..."
                className="input-saas resize-y font-mono text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Paste Raw Email Content with Headers
                </span>
                <span className="text-[11px] text-slate-400">Extracts From:, Subject:, and body automatically</span>
              </label>
              <textarea
                rows={9}
                value={rawEmailText}
                onChange={(e) => {
                  setRawEmailText(e.target.value);
                  handleParseRawEmail(e.target.value);
                }}
                placeholder="From: service@paypal-verify.xyz&#10;Subject: Account Suspended&#10;&#10;Dear user, click http://bit.ly/login to verify your password..."
                className="input-saas resize-y font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white btn-purple-gradient flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? "Running Multi-Layer Security Scan..." : "🔍 Analyze Email Threat"}</span>
          </button>

          {(sender || subject || body || rawEmailText) && (
            <button
              onClick={handleClear}
              disabled={loading}
              className="px-4 py-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Real-time Analysis Progress Pipeline */}
      {loading && (
        <div className="white-glass-card rounded-2xl p-6 border border-indigo-500/30 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
              Performing Comprehensive Threat Scan...
            </span>
            <span>Step {pipelineIndex + 1} of {ANALYSIS_PIPELINE.length}</span>
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
                  className={`flex items-center gap-2.5 text-xs font-semibold transition-colors ${
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

      {/* COMPREHENSIVE RESULT SECTION */}
      {result && !loading && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main Risk Verdict Hero Card */}
          <div className={`rounded-2xl p-6 sm:p-8 border transition-all ${
            result.prediction === "spam" ? "glow-spam-card" : "glow-safe-card"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    result.prediction === "spam" ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}>
                    {result.prediction === "spam" ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{result.threat_level ? result.threat_level.toUpperCase() : (result.prediction === "spam" ? "HIGH RISK SPAM" : "CLEAN & SAFE")}</span>
                  </span>

                  {result.threat_category && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Category: {result.threat_category}
                    </span>
                  )}

                  {result.urgency_level && result.urgency_level !== "None" && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Urgency: {result.urgency_level}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {result.prediction === "spam" 
                    ? (result.threat_category || "Spam / Phishing Detected") 
                    : "Legitimate & Safe Email"}
                </h3>
                
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              {/* Composite Risk Meter (0 - 100) */}
              <div className="bg-[#0b1026]/90 p-5 rounded-2xl border border-slate-800 text-center min-w-[220px] space-y-3 shadow-xl">
                <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  Composite Risk Score
                </div>
                
                <div className="flex items-center justify-center gap-1">
                  <span className={`text-5xl font-black font-mono ${
                    result.risk_score >= 70 ? "text-red-400" : (result.risk_score >= 35 ? "text-amber-400" : "text-emerald-400")
                  }`}>
                    {result.risk_score ?? Math.round(result.spam_probability * 100)}
                  </span>
                  <span className="text-sm font-normal text-slate-500">/ 100</span>
                </div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      getScoreGradient(result.risk_score ?? Math.round(result.spam_probability * 100))
                    }`}
                    style={{ width: `${Math.max(6, result.risk_score ?? Math.round(result.spam_probability * 100))}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-semibold pt-1 border-t border-slate-800 font-mono">
                  <span className="text-red-400">Spam: {(result.spam_probability * 100).toFixed(1)}%</span>
                  <span className="text-emerald-400">Safe: {(result.ham_probability * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Tool Bar: Copy Report & Print */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="text-xs text-slate-400">
                Confidence: <span className="font-bold text-white font-mono">{result.confidence}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReport}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? "Copied Report!" : "Copy Report"}</span>
                </button>

                <button 
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Print PDF Audit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bilingual Tamil & English Explanation Card */}
          {result.tamil_summary && (
            <div className="white-glass-card rounded-2xl p-5 border border-indigo-500/30 space-y-3 bg-gradient-to-r from-indigo-950/30 to-purple-950/20">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Languages className="w-4 h-4 text-indigo-400" />
                  <span>தமிழ் விளக்கம் (Tamil Summary)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800">
                  Bilingual Support
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {result.tamil_summary}
              </p>
            </div>
          )}

          {/* Security Audit Matrix (6-Point Inspection) */}
          {result.security_checks && result.security_checks.length > 0 && (
            <div className="white-glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>6-Point Security Inspection Audit</span>
                </h4>
                <span className="text-xs text-slate-400">Multi-Factor Checks</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.security_checks.map((chk, idx) => {
                  const isPassed = chk.status === "passed";
                  const isWarning = chk.status === "warning";
                  return (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                        isPassed 
                          ? "bg-slate-900/50 border-emerald-500/20 text-slate-300"
                          : isWarning
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                            : "bg-red-500/10 border-red-500/30 text-red-200"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <AlertOctagon className="w-4 h-4 text-red-400" />
                        )}
                      </div>

                      <div className="space-y-0.5 text-xs">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{chk.name}</span>
                          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-extrabold ${
                            isPassed ? "text-emerald-400 bg-emerald-500/10" : isWarning ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"
                          }`}>
                            {chk.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{chk.details}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* URL Threat Intelligence Section (if URLs present) */}
          {result.urls_detected && result.urls_detected.length > 0 && (
            <div className="white-glass-card rounded-2xl p-6 space-y-4 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-indigo-400" />
                  <span>Detected Link Intelligence ({result.urls_detected.length})</span>
                </h4>
                <span className="text-xs text-slate-400">Destination Safety Scan</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                      <th className="py-2 px-3">Found URL</th>
                      <th className="py-2 px-3">Target Domain</th>
                      <th className="py-2 px-3 text-center">Threat Type</th>
                      <th className="py-2 px-3 text-right">Risk Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {result.urls_detected.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 max-w-[220px] truncate text-slate-300" title={l.url}>
                          {l.url}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {l.domain || "N/A"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {l.is_shortener ? (
                            <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-bold">
                              URL Shortener
                            </span>
                          ) : l.is_ip ? (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold">
                              IP Address
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Standard Web Link</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            l.risk === "Critical" 
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : l.risk === "High"
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : l.risk === "Medium"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}>
                            {l.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actionable Recommendations & Keywords Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recommendations */}
            <div className="white-glass-card rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Actionable Security Next Steps</span>
              </h4>

              <div className="space-y-2 text-xs">
                {result.recommendations && result.recommendations.length > 0 ? (
                  result.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 leading-relaxed font-medium">
                      {rec}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs">No special interventions required for routine email.</p>
                )}
              </div>
            </div>

            {/* Keyword Indicators */}
            <div className="white-glass-card rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Influential Linguistic Signals</span>
              </h4>

              <p className="text-[11px] text-slate-400">
                Top vocabulary features that contributed most heavily to the machine learning model's determination:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {result.keywords && result.keywords.length > 0 ? (
                  result.keywords.map((kw, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-semibold"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Normal baseline vocabulary</span>
                )}
              </div>

              {result.sender_analysis?.spoofing_warning && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  <span className="font-bold">⚠️ Spoofing Warning: </span>
                  {result.sender_analysis.spoofing_warning}
                </div>
              )}
            </div>

          </div>

          {/* Feedback Section */}
          <div className="white-glass-card rounded-2xl p-6 space-y-4 border border-slate-800 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Was this analysis accurate?</h4>
                <p className="text-[11px] text-slate-400">Your audit feedback helps fine-tune model classification thresholds.</p>
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
                  <span>👍 Accurate</span>
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
                  <span>👎 Inaccurate</span>
                </button>
              </div>
            </div>

            {/* Optional feedback text notes */}
            {showFeedbackInput && (
              <div className="pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
                <textarea
                  rows={2}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="What was incorrect about this prediction? (e.g., missed invoice scam, false alarm on company announcement)"
                  className="input-saas text-xs"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Feedback logs are saved for training workflow auditing.</span>
                  <button
                    onClick={() => {
                      handleSendFeedback(feedbackVote, feedbackNotes);
                      setShowFeedbackInput(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold flex items-center gap-1 hover:bg-indigo-500"
                  >
                    <Send className="w-3 h-3" />
                    <span>Submit Audit Feedback</span>
                  </button>
                </div>
              </div>
            )}

            {feedbackSubmitted && !showFeedbackInput && (
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Thank you! Your evaluation has been saved to audit logs.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 500 Sample Dataset Explorer Modal */}
      <SampleLibraryModal
        isOpen={isSampleLibraryOpen}
        onClose={() => setIsSampleLibraryOpen(false)}
        onSelectSample={(sample) => {
          setSender(sample.sender);
          setSubject(sample.subject);
          setBody(sample.body);
          setRawEmailText(`From: ${sample.sender}\nSubject: ${sample.subject}\n\n${sample.body}`);
          setActiveSample("");
          setErrorMsg("");
          setResult(null);
        }}
      />

    </div>
  );
}
