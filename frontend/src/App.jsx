import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import AnalyzePage from "./pages/AnalyzePage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import SecurityPage from "./pages/SecurityPage";
import ModelPage from "./pages/ModelPage";
import AboutPage from "./pages/AboutPage";
import { ShieldCheck, Heart } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [statistics, setStatistics] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  const fetchStatistics = () => {
    fetch("http://127.0.0.1:8000/statistics")
      .then((res) => res.json())
      .then((data) => setStatistics(data))
      .catch((err) => console.log("Failed to fetch prediction statistics:", err));
  };

  const fetchModelInfo = () => {
    fetch("http://127.0.0.1:8000/model-info")
      .then((res) => res.json())
      .then((data) => setModelInfo(data))
      .catch((err) => console.log("Failed to fetch model info:", err));
  };

  useEffect(() => {
    fetchStatistics();
    fetchModelInfo();
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        {activeTab === "home" && (
          <HomePage setActiveTab={setActiveTab} statistics={statistics} />
        )}
        {activeTab === "analyze" && (
          <AnalyzePage onAnalysisComplete={fetchStatistics} />
        )}
        {activeTab === "dashboard" && (
          <DashboardPage statistics={statistics} setActiveTab={setActiveTab} />
        )}
        {activeTab === "history" && (
          <HistoryPage statistics={statistics} />
        )}
        {activeTab === "security" && (
          <SecurityPage />
        )}
        {activeTab === "model" && (
          <ModelPage modelInfo={modelInfo} />
        )}
        {activeTab === "about" && (
          <AboutPage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060919]/90 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">MailGuard AI</span>
            <span>— Intelligent Email Security Platform</span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span>Powered by FastAPI & React</span>
          </div>
        </div>
      </footer>

    </div>
  );
}