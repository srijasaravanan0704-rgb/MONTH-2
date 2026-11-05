import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  ScanEye,
  History,
  LineChart,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function MainLayout() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check API health status
    api.getHealth()
      .then((data) => {
        setApiOnline(data.status === 'healthy');
      })
      .catch(() => {
        setApiOnline(false);
      });
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/scanner', label: 'Message Scanner', icon: ScanEye },
    { to: '/history', label: 'Scan History', icon: History },
    { to: '/insights', label: 'Model Insights', icon: LineChart },
    { to: '/settings', label: 'Settings & About', icon: Settings },
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Cybersecurity Risk Dashboard';
      case '/scanner':
        return 'Intelligent Message Risk Scanner';
      case '/history':
        return 'Audit & Scan History';
      case '/insights':
        return 'Machine Learning Insights & Evaluation';
      case '/settings':
        return 'System Configuration & Provenance';
      default:
        return 'PhishShift Security Platform';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* DESKTOP SIDEBAR: Dark Navy Style (#0B1120 / #0F172A) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 z-20">
        {/* Brand / Logo */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-cyan-950/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">PhishShift</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                ML-07
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide">Risk Assessment SaaS</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Status & Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 space-y-3">
          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400">Backend API:</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={apiOnline ? 'text-emerald-400' : 'text-rose-400'}>
                {apiOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Educational security triage.<br />Does not guarantee zero risk.
          </p>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-slate-900 text-slate-200 border-r border-slate-800 p-5 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="font-bold text-white">PhishShift</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Quick Actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            {location.pathname !== '/scanner' && (
              <button
                onClick={() => navigate('/scanner')}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm transition-all shadow-cyan-900/20 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Scan Message
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>
            PhishShift: Intelligent Message Risk Scanner (ML-07) &bull; Machine Learning, Explainability & Robustness Testing &bull; Built with FastAPI, scikit-learn & React.
          </p>
        </footer>
      </div>
    </div>
  );
}
