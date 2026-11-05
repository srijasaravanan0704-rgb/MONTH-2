import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Shield,
  Lock,
  Moon,
  Sun,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Code2,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [defaultModel, setDefaultModel] = useState('linear_svm');
  const [highRiskThreshold, setHighRiskThreshold] = useState(0.70);
  const [lowRiskThreshold, setLowRiskThreshold] = useState(0.40);
  const [storeMessageBodyDefault, setStoreMessageBodyDefault] = useState(false);
  const [models, setModels] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, modelsRes] = await Promise.all([
        api.getSettings(),
        api.getModels()
      ]);
      setDefaultModel(settingsRes.default_model);
      setHighRiskThreshold(settingsRes.high_risk_threshold);
      setLowRiskThreshold(settingsRes.low_risk_threshold);
      setStoreMessageBodyDefault(settingsRes.store_message_body_default);
      setModels(modelsRes);
    } catch (err) {
      console.error(err);
      addToast('Failed to load system settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (lowRiskThreshold >= highRiskThreshold) {
      addToast('Low Risk threshold must be strictly less than High Risk threshold.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await api.updateSettings({
        default_model: defaultModel,
        high_risk_threshold: parseFloat(highRiskThreshold),
        low_risk_threshold: parseFloat(lowRiskThreshold),
        store_message_body_default: storeMessageBodyDefault
      });
      addToast('Settings successfully updated and saved to SQLite.', 'success');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error updating settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading configuration options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          System Configuration & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize risk decision thresholds, default classifier architectures, and scan history privacy preferences.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* APPEARANCE & THEME */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sun className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Interface Appearance</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Application Theme
              </div>
              <p className="text-xs text-slate-400">
                Current mode: <strong className="capitalize">{theme}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CLASSIFIER & RISK THRESHOLDS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-cyan-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Classifier & Threshold Calibration</h2>
          </div>

          {/* Default Model */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Default Production Model
            </label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Selects the model used for standard scan evaluations unless manually overridden.
            </p>
          </div>

          {/* Threshold Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {/* High Risk Threshold */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  High Risk Threshold:
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {(highRiskThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={highRiskThreshold}
                onChange={(e) => setHighRiskThreshold(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Probability &ge; {(highRiskThreshold * 100).toFixed(0)}% triggers "Higher Risk" warning.
              </p>
            </div>

            {/* Low Risk Threshold */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Low Risk Threshold:
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {(lowRiskThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={lowRiskThreshold}
                onChange={(e) => setLowRiskThreshold(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Probability &le; {(lowRiskThreshold * 100).toFixed(0)}% triggers "Lower Risk" determination.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Uncertainty Band:</strong> Messages with probabilities between{' '}
            <strong>{(lowRiskThreshold * 100).toFixed(0)}%</strong> and{' '}
            <strong>{(highRiskThreshold * 100).toFixed(0)}%</strong> are automatically categorized as{' '}
            <strong>"Needs Review"</strong> to prevent false positives and brittle misclassifications.
          </div>
        </div>

        {/* SCAN HISTORY PRIVACY SETTING */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-emerald-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Audit & Data Privacy</h2>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="storeDefault"
              checked={storeMessageBodyDefault}
              onChange={(e) => setStoreMessageBodyDefault(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
            />
            <div>
              <label htmlFor="storeDefault" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Store complete message bodies by default
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                When disabled (recommended), the backend only stores the first 180 characters as an audit preview in SQLite, safeguarding employee communications and mailbox contents from persistent database storage.
              </p>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-950/20 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Configuration...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ARCHITECTURE & PROVENANCE DETAILS */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Code2 className="w-4 h-4 text-purple-500" />
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">Architecture & Educational Disclaimer</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 text-[11px]">Project Designation</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">PhishShift (Project Code: ML-07)</div>
            <div className="text-[11px] text-slate-500">Cybersecurity, NLP, Model Explainability</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 text-[11px]">Backend & ML Stack</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">Python 3.12, FastAPI, scikit-learn, SQLite</div>
            <div className="text-[11px] text-slate-500">TF-IDF N-grams (1,2) + Platt Calibrated Linear SVM</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 leading-relaxed">
          <p>
            <strong className="text-slate-700 dark:text-slate-300">Disclaimer of Educational Use: </strong>
            PhishShift is engineered for educational, triage, and threat awareness simulations. No statistical natural language model can guarantee complete defense against advanced spear-phishing or zero-day credential campaigns. Always confirm unexpected corporate changes or wire transfers through certified, out-of-band communication channels.
          </p>
        </div>
      </div>
    </div>
  );
}
