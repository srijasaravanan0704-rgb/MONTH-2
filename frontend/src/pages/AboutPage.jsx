import React from "react";
import { Info, Code2, ShieldCheck, Cpu, Terminal, Sparkles } from "lucide-react";

export default function AboutPage() {
  const techStack = [
    { name: "React", category: "Frontend Framework", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
    { name: "FastAPI", category: "Backend REST API", color: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
    { name: "Python", category: "Core Machine Learning", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { name: "TF-IDF", category: "NLP Feature Extraction", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
    { name: "Machine Learning", category: "Scikit-Learn Classifier", color: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
    { name: "Tailwind CSS", category: "UI & Glassmorphic Styling", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fadeIn">
      
      {/* Overview Card */}
      <div className="white-glass-card rounded-2xl p-8 space-y-6 text-center border border-slate-800 relative overflow-hidden">
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 mx-auto shadow-xl shadow-indigo-500/30">
          <div className="w-full h-full bg-[#0b1026] rounded-[14px] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">About MailGuard AI</h2>
          <p className="text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            An AI-powered email security platform designed to detect spam and suspicious messages using machine learning.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800/80 max-w-lg mx-auto text-xs text-slate-400">
          MailGuard AI delivers sub-second threat analysis, explainable keyword risk indicators, and historical auditing to keep users safe from phishing scams and fraud.
        </div>
      </div>

      {/* Technology Stack Section */}
      <div className="white-glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          Technology Stack
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {techStack.map((tech, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-xl border ${tech.color} space-y-1 transition-all hover:scale-[1.02]`}
            >
              <div className="text-base font-extrabold">{tech.name}</div>
              <div className="text-[10px] opacity-80 uppercase tracking-wider font-medium">
                {tech.category}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
