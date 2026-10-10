import React from "react";
import { Shield, AlertTriangle, CheckCircle2, Lock, Link2, KeyRound, FileWarning, ExternalLink } from "lucide-react";

export default function SecurityPage() {
  const threatCategories = [
    { title: "PHISHING", percent: 42, color: "bg-red-500", labelColor: "text-red-400" },
    { title: "FINANCIAL SCAM", percent: 26, color: "bg-amber-500", labelColor: "text-amber-400" },
    { title: "PRIZE SCAM", percent: 18, color: "bg-purple-500", labelColor: "text-purple-400" },
    { title: "PROMOTIONAL", percent: 14, color: "bg-blue-500", labelColor: "text-blue-400" },
  ];

  const suspiciousPatterns = [
    "Urgent action required (\"Account suspended within 24h\")",
    "Prize / reward claims (\"You won $1,000,000 cash\")",
    "Financial requests (\"Update banking / credit card info\")",
    "Account verification (\"Confirm password or SSN immediately\")",
    "Suspicious links (\"bit.ly / shorteners / fake domains\")",
    "Unusual currency symbols or mismatched sender domains"
  ];

  const securityGuidance = [
    {
      icon: Link2,
      title: "URL & Link Inspection Guidance",
      desc: "Never click links directly in suspicious emails. Hover your cursor over the link (without clicking) to inspect the actual destination URL in your browser status bar. Ensure the domain matches the official company site exactly."
    },
    {
      icon: KeyRound,
      title: "Password & OTP Protection",
      desc: "Legitimate organizations, banks, and service providers will NEVER ask for your password, PIN, or 2FA One-Time Passwords via email or SMS. Treat any request for credentials as high-risk phishing."
    },
    {
      icon: FileWarning,
      title: "Suspicious Attachments Safety",
      desc: "Avoid downloading or opening attachments with double extensions (e.g. invoice.pdf.exe) or compressed archives (.zip, .rar, .iso) from unknown senders. Always scan attachments using antivirus software before opening."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4 animate-fadeIn">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          Security Center
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Cybersecurity threat classification breakdown, common phishing vectors, link inspection rules, and email safety practices.
        </p>
      </div>

      {/* Threat Categories */}
      <div className="white-glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          Threat categories
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
          Common suspicious patterns
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suspiciousPatterns.map((pattern, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
              <span className="text-amber-400 font-bold shrink-0">⚠</span>
              <span>{pattern}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
