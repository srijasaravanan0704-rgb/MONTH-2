import React, { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, Lock, Link2, KeyRound, FileWarning, Search, ExternalLink, Sparkles } from "lucide-react";

export default function SecurityPage() {
  const [testUrl, setTestUrl] = useState("");
  const [urlScanResult, setUrlScanResult] = useState(null);

  const threatCategories = [
    { title: "PHISHING & CREDENTIAL THEFT", percent: 44, color: "bg-red-500", labelColor: "text-red-400" },
    { title: "FINANCIAL & LOTTERY SCAMS", percent: 24, color: "bg-amber-500", labelColor: "text-amber-400" },
    { title: "FAKE INVOICE & DELIVERY FEES", percent: 18, color: "bg-orange-500", labelColor: "text-orange-400" },
    { title: "PROMOTIONAL & SPAM BULK", percent: 14, color: "bg-blue-500", labelColor: "text-blue-400" },
  ];

  const suspiciousPatterns = [
    "Artificial urgency (\"Account suspended within 24h\", \"Final warning\")",
    "Grand prize / lottery reward claims (\"You won $2,500,000 cash\")",
    "Financial credential requests (\"Update banking / verify credit card info\")",
    "Sensitive security prompts (\"Confirm password or enter OTP immediately\")",
    "Masked links & URL shorteners (\"bit.ly / tinyurl / lookalike domains\")",
    "Sender domain spoofing (Display name says PayPal but email is @gmail.com)"
  ];

  const securityGuidance = [
    {
      icon: Link2,
      title: "URL & Link Inspection Guidance",
      desc: "Never click links directly in unexpected emails. Hover your cursor over the link to verify the true destination URL in your browser status bar. Ensure the domain matches the official company website exactly."
    },
    {
      icon: KeyRound,
      title: "Password & OTP Protection",
      desc: "Legitimate organizations, banks, and service providers will NEVER ask for your password, PIN, or 2FA One-Time Passwords via email or SMS. Treat any request for credentials as high-risk phishing."
    },
    {
      icon: FileWarning,
      title: "Suspicious Attachments Safety",
      desc: "Avoid downloading or opening attachments with double extensions (e.g. invoice.pdf.exe) or compressed archives (.zip, .iso, .scr) from unknown senders. Always scan attachments using security software."
    }
  ];

  const handleScanUrl = () => {
    if (!testUrl.trim()) return;
    const lower = testUrl.trim().toLowerCase();
    
    const isShortener = /bit\.ly|tinyurl|t\.co|is\.gd|cutt\.ly|shorturl\.at|rebrand\.ly/.test(lower);
    const isIp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(lower);
    const isSuspiciousTld = /\.(xyz|top|buzz|icu|click|cam|tk|ml|ga|cf|gq|work|loan)\b/.test(lower);
    const hasPhishPath = /login|signin|verify|banking|secure|claim|account-suspended/.test(lower);

    let risk = "Clean";
    let message = "This link appears standard, but always verify the domain matches the intended brand.";
    let flags = [];

    if (isIp) {
      risk = "Critical";
      flags.push("Raw IP address used instead of domain name");
    }
    if (isShortener) {
      risk = risk === "Critical" ? "Critical" : "High";
      flags.push("URL shortener obscures the true destination website");
    }
    if (isSuspiciousTld) {
      risk = risk === "Critical" ? "Critical" : "High";
      flags.push("Suspicious high-abuse Top Level Domain");
    }
    if (hasPhishPath) {
      risk = risk === "Clean" ? "Medium" : risk;
      flags.push("Path targets login, verification or credentials");
    }

    if (flags.length > 0) {
      message = flags.join(". ") + ".";
    }

    setUrlScanResult({ url: testUrl, risk, message, flags });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4 animate-fadeIn">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          Security Center & Threat Intelligence
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Cybersecurity threat classification breakdown, common phishing vectors, link inspection rules, and email safety practices.
        </p>
      </div>

      {/* Interactive URL Inspector Widget */}
      <div className="white-glass-card rounded-2xl p-6 sm:p-8 space-y-4 border border-indigo-500/30">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-400" />
            <span>Interactive URL Threat Scanner</span>
          </h3>
          <span className="text-[11px] text-indigo-300 font-semibold px-2 py-0.5 rounded bg-indigo-500/10">
            Link Safety Tool
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Paste any suspicious link to test for URL shorteners, raw IP destinations, and high-risk domain patterns.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="e.g. http://bit.ly/bank-login-verify or https://secure-account.xyz"
            className="input-saas font-mono text-xs flex-1"
          />
          <button
            onClick={handleScanUrl}
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white btn-purple-gradient shrink-0"
          >
            Scan URL
          </button>
        </div>

        {urlScanResult && (
          <div className={`p-4 rounded-xl border mt-3 space-y-2 animate-fadeIn ${
            urlScanResult.risk === "Critical" 
              ? "bg-red-500/10 border-red-500/30 text-red-200"
              : urlScanResult.risk === "High"
                ? "bg-orange-500/10 border-orange-500/30 text-orange-200"
                : urlScanResult.risk === "Medium"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span>Verdict:</span>
                <span className="px-2 py-0.5 rounded bg-black/40">{urlScanResult.risk}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs">{urlScanResult.url}</span>
            </div>
            <p className="text-xs leading-relaxed">{urlScanResult.message}</p>
          </div>
        )}
      </div>

      {/* Threat Categories */}
      <div className="white-glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          Threat Vector Distribution
        </h3>

        <div className="space-y-4">
          {threatCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className={cat.labelColor}>{cat.title}</span>
                <span className="text-slate-300 font-mono">{cat.percent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${cat.color}`}
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Practical Security Guidance Section */}
      <div className="white-glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Essential Security & Link Guidance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {securityGuidance.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">{item.title}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suspicious Patterns */}
      <div className="white-glass-card rounded-2xl p-6 space-y-4 border border-amber-500/20">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Common Email Red Flags & Attack Signatures
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suspiciousPatterns.map((pattern, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
              <span className="text-amber-400 font-bold shrink-0">⚠️</span>
              <span>{pattern}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
