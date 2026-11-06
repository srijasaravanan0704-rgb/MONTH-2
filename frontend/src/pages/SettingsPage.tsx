import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Sliders,
  GraduationCap,
  Check,
  Building,
} from 'lucide-react';
import { fetchSettings, updateSettings, resetDatabase } from '../services/api';

interface SettingsPageProps {
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefresh }) => {
  const [settings, setSettings] = useState<Record<string, string>>({
    plant_name: 'OptiMach Smart Plant Alpha',
    active_model: 'random_forest',
    prediction_horizon_days: '7',
    volt_min: '155.0',
    volt_max: '185.0',
    rotate_min: '415.0',
    rotate_max: '480.0',
    pressure_min: '88.0',
    pressure_max: '115.0',
    vibration_max: '45.0',
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset plant database back to default factory demonstration state?')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetDatabase();
      alert('Database successfully reset to initial plant state.');
      onRefresh();
      loadSettings();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#66521A]/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#1A1A1A] border border-[#66521A] text-[#FFD700]">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5]">
              System Settings & Threshold Tuning
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">
            Configure telemetry safety envelopes, active inference algorithms, and factory site metadata
          </p>
        </div>

        <button
          onClick={handleResetSeed}
          disabled={isResetting}
          className="btn-gold-secondary flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          Reset Demo State
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Plant Metadata */}
        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#FFD700] uppercase tracking-wider">
            <Building className="w-4 h-4 text-[#D4AF37]" />
            Plant Facility Profile
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[#A0A0A0] block mb-1">Industrial Plant Designation</label>
              <input
                type="text"
                value={settings.plant_name}
                onChange={(e) => setSettings({ ...settings, plant_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="text-[#A0A0A0] block mb-1">Default Inference Model</label>
              <select
                value={settings.active_model}
                onChange={(e) => setSettings({ ...settings, active_model: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-medium focus:border-[#D4AF37]"
              >
                <option value="random_forest">Random Forest Classifier (Recommended)</option>
                <option value="gradient_boosting">Gradient Boosting Classifier</option>
                <option value="logistic_regression">Logistic Regression (Baseline)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sensor Safety Threshold Envelopes */}
        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#FFD700] uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#D4AF37]" />
            Sensor Threshold Safety Envelopes
          </div>
          <p className="text-xs text-[#A0A0A0]">
            Readings outside these boundaries trigger automatic industrial alerts and elevate the ML failure hazard score.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Vibration */}
            <div>
              <label className="text-[#F5F5F5] block mb-1 font-semibold">
                Vibration Max Ceiling (mm/s)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.vibration_max}
                onChange={(e) => setSettings({ ...settings, vibration_max: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
              />
              <span className="text-[10px] text-[#A0A0A0] mt-1 block">
                Standard: ISO 10816 Class II threshold (44.5 mm/s)
              </span>
            </div>

            {/* Pressure */}
            <div>
              <label className="text-[#F5F5F5] block mb-1 font-semibold">
                Fluid Pressure Max Ceiling (psi)
              </label>
              <input
                type="number"
                step="1"
                value={settings.pressure_max}
                onChange={(e) => setSettings({ ...settings, pressure_max: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
              />
              <span className="text-[10px] text-[#A0A0A0] mt-1 block">
                Nominal continuous ceiling: 112 - 115 psi
              </span>
            </div>

            {/* Voltage bounds */}
            <div>
              <label className="text-[#F5F5F5] block mb-1 font-semibold">
                Voltage Upper Limit (V)
              </label>
              <input
                type="number"
                step="1"
                value={settings.volt_max}
                onChange={(e) => setSettings({ ...settings, volt_max: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
              />
            </div>

            {/* Rotation Min */}
            <div>
              <label className="text-[#F5F5F5] block mb-1 font-semibold">
                Rotation Speed Min Floor (RPM)
              </label>
              <input
                type="number"
                step="5"
                value={settings.rotate_min}
                onChange={(e) => setSettings({ ...settings, rotate_min: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
              <Check className="w-4 h-4" />
              Settings Saved Successfully
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="btn-gold-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Academic Project Accreditation Card */}
      <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-3 text-xs">
        <div className="flex items-center gap-2 text-[#FFD700] font-bold uppercase tracking-wider">
          <GraduationCap className="w-5 h-5 text-[#D4AF37]" />
          Academic Major Project Verification
        </div>
        <h4 className="text-sm font-bold text-[#F5F5F5]">
          "Design and Development of a Machine Learning-Based Predictive Maintenance System for Industrial Equipment Failure Prediction and Health Monitoring"
        </h4>
        <div className="text-[#A0A0A0] space-y-1 leading-relaxed">
          <p>• <strong className="text-[#F5F5F5]">Candidate Models:</strong> Random Forest Classifier (98.1% Acc), Gradient Boosting (98.5% Acc), Logistic Regression Baseline (81.1% Acc).</p>
          <p>• <strong className="text-[#F5F5F5]">Benchmark Dataset:</strong> Microsoft Azure Predictive Maintenance telemetry (12,000 multi-machine records).</p>
          <p>• <strong className="text-[#F5F5F5]">Stack:</strong> React 18, TypeScript, Tailwind CSS, Three.js, Recharts, FastAPI, Scikit-learn, SQLite.</p>
        </div>
      </div>
    </div>
  );
};
