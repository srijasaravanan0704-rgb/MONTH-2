import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sliders,
  Upload,
  Download,
  AlertTriangle,
  Wrench,
  Zap,
  Activity,
  Gauge,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
} from 'lucide-react';
import {
  Machine,
  PredictionResult,
  BatchPredictionResponse,
} from '../types';
import { predictManual, predictBatchCSV, getSampleCsvUrl } from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { CircularGauge } from '../components/CircularGauge';
import { playClickSound, playAlertSound } from '../utils/audio';

interface PredictiveAiPageProps {
  machines: Machine[];
  preselectedMachine?: Machine | null;
  onOpenWorkOrderModal: (machineId: string, title?: string, desc?: string, priority?: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const PredictiveAiPage: React.FC<PredictiveAiPageProps> = ({
  machines,
  preselectedMachine,
  onOpenWorkOrderModal,
}) => {
  const [activeMethod, setActiveMethod] = useState<'manual' | 'csv'>('manual');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(preselectedMachine?.id || 'MCH-04');
  const [selectedModel, setSelectedModel] = useState<string>('random_forest');

  // Input states
  const [volt, setVolt] = useState<number>(185.0);
  const [rotate, setRotate] = useState<number>(410.0);
  const [pressure, setPressure] = useState<number>(115.0);
  const [vibration, setVibration] = useState<number>(52.0);

  // Status & results
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  // Comparative predictions across all 3 models
  const [comparativeResults, setComparativeResults] = useState<{
    rf?: number;
    gb?: number;
    lr?: number;
  }>({});

  // CSV states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isCsvUploading, setIsCsvUploading] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<BatchPredictionResponse | null>(null);

  useEffect(() => {
    if (preselectedMachine) {
      setSelectedMachineId(preselectedMachine.id);
      setVolt(preselectedMachine.volt);
      setRotate(preselectedMachine.rotate);
      setPressure(preselectedMachine.pressure);
      setVibration(preselectedMachine.vibration);
    }
  }, [preselectedMachine]);

  const handleMachineSelect = (mId: string) => {
    playClickSound();
    setSelectedMachineId(mId);
    const m = machines.find((item) => item.id === mId);
    if (m) {
      setVolt(m.volt);
      setRotate(m.rotate);
      setPressure(m.pressure);
      setVibration(m.vibration);
    }
  };

  const applyPreset = (preset: 'nominal' | 'bearing' | 'pressure' | 'voltage') => {
    playClickSound();
    switch (preset) {
      case 'nominal':
        setVolt(170.8);
        setRotate(448.0);
        setPressure(100.5);
        setVibration(40.2);
        break;
      case 'bearing':
        setVolt(173.5);
        setRotate(412.0);
        setPressure(104.0);
        setVibration(56.8);
        break;
      case 'pressure':
        setVolt(175.2);
        setRotate(418.0);
        setPressure(128.4);
        setVibration(47.2);
        break;
      case 'voltage':
        setVolt(196.4);
        setRotate(424.0);
        setPressure(106.0);
        setVibration(48.5);
        break;
    }
  };

  // Run Manual Prediction + Comparative multi-model inference
  const handleRunPrediction = async () => {
    playClickSound();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [resMain, resRf, resGb, resLr] = await Promise.all([
        predictManual(Number(volt), Number(rotate), Number(pressure), Number(vibration), selectedModel, selectedMachineId),
        predictManual(Number(volt), Number(rotate), Number(pressure), Number(vibration), 'random_forest', selectedMachineId),
        predictManual(Number(volt), Number(rotate), Number(pressure), Number(vibration), 'gradient_boosting', selectedMachineId),
        predictManual(Number(volt), Number(rotate), Number(pressure), Number(vibration), 'logistic_regression', selectedMachineId),
      ]);

      setPredictionResult(resMain);
      setComparativeResults({
        rf: Math.round(resRf.failure_probability * 100),
        gb: Math.round(resGb.failure_probability * 100),
        lr: Math.round(resLr.failure_probability * 100),
      });

      if (resMain.risk_category === 'Critical') {
        playAlertSound();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during ML prediction');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleRunPrediction();
  }, [selectedModel]);

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setCsvError('Please select a valid .csv file.');
        setCsvFile(null);
        return;
      }
      setCsvFile(file);
      setCsvError(null);
    }
  };

  // Run CSV Batch Prediction
  const handleRunCsvBatch = async () => {
    if (!csvFile) {
      setCsvError('Please select a CSV file first.');
      return;
    }
    playClickSound();
    setIsCsvUploading(true);
    setCsvError(null);
    try {
      const res = await predictBatchCSV(csvFile, selectedModel);
      setBatchResults(res);
    } catch (err: any) {
      setCsvError(err.message || 'Failed to process CSV file.');
    } finally {
      setIsCsvUploading(false);
    }
  };

  // Time-to-failure (TTF) calculation
  const prob = predictionResult?.failure_probability ?? 0.5;
  const ttfHours = Math.max(12, Math.round((1 - prob) * 168)); // 168 hrs in 7 days
  const ttfDays = (ttfHours / 24).toFixed(1);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#66521A]/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] text-[#FFD700]">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F5F5F5] tracking-tight">
              Predictive Maintenance AI Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">
            Supervised machine learning inference for 7-day equipment failure hazard forecasting and actionable engineering prescription
          </p>
        </div>

        {/* Method Switcher */}
        <div className="flex items-center bg-[#121212] p-1 rounded-2xl border border-[#66521A] self-start sm:self-auto">
          <button
            onClick={() => {
              playClickSound();
              setActiveMethod('manual');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMethod === 'manual'
                ? 'btn-gold-primary shadow-md'
                : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Method A: Manual Input
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveMethod('csv');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMethod === 'csv'
                ? 'btn-gold-primary shadow-md'
                : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Method B: CSV Upload
          </button>
        </div>
      </div>

      {/* Model Selection Bar */}
      <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-[#F5F5F5] font-bold">Active Supervised Inference Model:</span>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: 'random_forest', name: 'Random Forest', badge: 'Candidate (98.1%)' },
            { id: 'gradient_boosting', name: 'Gradient Boosting', badge: 'Comparison (98.5%)' },
            { id: 'logistic_regression', name: 'Logistic Regression', badge: 'Baseline (81.1%)' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                playClickSound();
                setSelectedModel(m.id);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                selectedModel === m.id
                  ? 'bg-[#121212] text-[#FFD700] border-[#D4AF37] shadow-md font-bold'
                  : 'bg-[#121212] text-[#A0A0A0] border-[#66521A]/50 hover:text-[#F5F5F5]'
              }`}
            >
              <span>{m.name}</span>
              <span className="ml-1.5 text-[10px] text-[#A0A0A0] hidden sm:inline">[{m.badge}]</span>
            </button>
          ))}
        </div>
      </div>

      {activeMethod === 'manual' ? (
        /* METHOD A: MANUAL INPUT & AI INFERENCE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-2xl space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
                  1. Machine Asset Context
                </h3>
                <span className="text-[10px] text-[#FFD700] font-mono font-semibold">Horizon: 7 Days</span>
              </div>
              <label className="text-xs text-[#A0A0A0] block mb-1.5">Target Industrial Machine:</label>
              <select
                value={selectedMachineId}
                onChange={(e) => handleMachineSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#66521A]/70 text-xs text-[#F5F5F5] font-medium focus:outline-none focus:border-[#D4AF37] shadow-inner"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.name} ({m.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Diagnostic Scenario Presets */}
            <div>
              <label className="text-xs text-[#A0A0A0] block mb-1.5 flex items-center justify-between">
                <span className="font-semibold text-[#F5F5F5]">Diagnostic Physical Presets:</span>
                <span className="text-[10px] text-[#A0A0A0]">Quick Test Scenarios</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => applyPreset('nominal')}
                  className="px-3 py-2 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] border border-emerald-500/40 text-emerald-300 text-left transition-all"
                >
                  <span className="font-bold block text-[11px]">✓ Nominal State</span>
                  <span className="text-[10px] text-emerald-400/80">Normal vibration & pressure</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('bearing')}
                  className="px-3 py-2 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] border border-rose-500/40 text-rose-300 text-left transition-all"
                >
                  <span className="font-bold block text-[11px]">⚠️ Bearing Fault</span>
                  <span className="text-[10px] text-rose-400/80">Vibration &gt; 56 mm/s</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('pressure')}
                  className="px-3 py-2 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] border border-[#66521A] text-[#FFD700] text-left transition-all"
                >
                  <span className="font-bold block text-[11px]">⚠️ Pressure Surge</span>
                  <span className="text-[10px] text-[#D4AF37]/80">Pressure &gt; 128 psi</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('voltage')}
                  className="px-3 py-2 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] border border-indigo-500/40 text-indigo-300 text-left transition-all"
                >
                  <span className="font-bold block text-[11px]">⚡ Voltage Spike</span>
                  <span className="text-[10px] text-indigo-400/80">Voltage &gt; 196 V</span>
                </button>
              </div>
            </div>

            {/* Precision Sensor Sliders */}
            <div className="space-y-4 pt-2 border-t border-[#66521A]/50">
              <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
                2. Real-Time Telemetry Parameters
              </h3>

              {/* Voltage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F5F5F5] font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Voltage (V)
                  </span>
                  <span className="font-mono font-bold text-[#FFD700]">{volt.toFixed(1)} V</span>
                </div>
                <input
                  type="range"
                  min="130"
                  max="220"
                  step="0.5"
                  value={volt}
                  onChange={(e) => setVolt(parseFloat(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1.5 bg-[#121212] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#A0A0A0] font-mono">
                  <span>130 V</span>
                  <span>Baseline: 170.8 V</span>
                  <span>220 V</span>
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F5F5F5] font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Rotation Speed (RPM)
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{rotate.toFixed(0)} RPM</span>
                </div>
                <input
                  type="range"
                  min="320"
                  max="550"
                  step="1"
                  value={rotate}
                  onChange={(e) => setRotate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 h-1.5 bg-[#121212] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#A0A0A0] font-mono">
                  <span>320 RPM</span>
                  <span>Baseline: 446.6 RPM</span>
                  <span>550 RPM</span>
                </div>
              </div>

              {/* Pressure */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F5F5F5] font-semibold flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                    Fluid Pressure (psi)
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{pressure.toFixed(1)} psi</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="145"
                  step="0.5"
                  value={pressure}
                  onChange={(e) => setPressure(parseFloat(e.target.value))}
                  className="w-full accent-indigo-400 h-1.5 bg-[#121212] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#A0A0A0] font-mono">
                  <span>70 psi</span>
                  <span>Baseline: 100.9 psi</span>
                  <span>145 psi</span>
                </div>
              </div>

              {/* Vibration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F5F5F5] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Vibration Velocity (mm/s)
                  </span>
                  <span className="font-mono font-bold text-rose-400">{vibration.toFixed(1)} mm/s</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="68"
                  step="0.2"
                  value={vibration}
                  onChange={(e) => setVibration(parseFloat(e.target.value))}
                  className="w-full accent-rose-400 h-1.5 bg-[#121212] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#A0A0A0] font-mono">
                  <span>25 mm/s</span>
                  <span>Baseline: 40.4 mm/s</span>
                  <span>68 mm/s (Hazard)</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleRunPrediction}
              disabled={isLoading}
              className="w-full btn-gold-primary flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Model Inference...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run AI Failure Prediction
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
                {errorMsg}
              </div>
            )}
          </div>

          {/* AI Inference Diagnostic Results Column (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {predictionResult ? (
              <>
                {/* Result Hero Card */}
                <div className="p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#66521A]/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#FFD700]">
                          {predictionResult.machine_id}
                        </span>
                        <StatusBadge status={predictionResult.risk_category} size="md" />
                      </div>
                      <h2 className="text-lg font-black text-[#F5F5F5] mt-1">
                        7-Day Failure Risk Assessment
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                      <span>Model:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#121212] text-[#FFD700] border border-[#66521A] font-bold font-mono">
                        {predictionResult.model_name}
                      </span>
                    </div>
                  </div>

                  {/* Dual Gauges + Time-to-Failure (TTF) */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-[#121212] border border-[#66521A]/60 flex flex-col items-center text-center shadow-inner">
                      <CircularGauge
                        value={predictionResult.failure_probability_pct}
                        size={100}
                        strokeWidth={8}
                        label="Risk"
                        isRisk={true}
                      />
                      <span className="text-xs text-[#A0A0A0] mt-2 font-semibold">
                        7-Day Failure Odds
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#121212] border border-[#66521A]/60 flex flex-col items-center text-center shadow-inner">
                      <CircularGauge
                        value={predictionResult.health_score}
                        size={100}
                        strokeWidth={8}
                        label="Health"
                        isRisk={false}
                      />
                      <span className="text-xs text-[#A0A0A0] mt-2 font-semibold">
                        Health Score
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#121212] border border-[#66521A]/60 flex flex-col items-center justify-center text-center shadow-inner">
                      <Clock className="w-6 h-6 text-[#FFD700] mb-1" />
                      <span className="text-2xl font-black font-mono text-[#F5F5F5]">
                        {ttfDays} <span className="text-xs text-[#A0A0A0] font-normal">Days</span>
                      </span>
                      <span className="text-[10px] text-[#A0A0A0] mt-1 uppercase font-bold tracking-wider font-mono">
                        Time-To-Failure (TTF)
                      </span>
                      <span className="text-[10px] text-[#FFD700] font-mono mt-0.5">
                        ~{ttfHours} Operating Hrs
                      </span>
                    </div>
                  </div>

                  {/* Side-by-Side Comparative Model Probabilities */}
                  <div className="p-4 rounded-2xl bg-[#121212] border border-[#66521A]/50 space-y-2">
                    <span className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider font-mono block">
                      Multi-Model Consensus Comparison (Same Sensor Telemetry)
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#66521A]/60">
                        <span className="text-[10px] text-[#A0A0A0] block">Random Forest</span>
                        <span className="text-lg font-black font-mono text-[#FFD700]">
                          {comparativeResults.rf ?? predictionResult.failure_probability_pct}%
                        </span>
                        <span className="text-[9px] text-[#A0A0A0] block">Candidate (98.1%)</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#66521A]/60">
                        <span className="text-[10px] text-[#A0A0A0] block">Gradient Boost</span>
                        <span className="text-lg font-black font-mono text-[#D4AF37]">
                          {comparativeResults.gb ?? predictionResult.failure_probability_pct}%
                        </span>
                        <span className="text-[9px] text-[#A0A0A0] block">Comparison (98.5%)</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#66521A]/60">
                        <span className="text-[10px] text-[#A0A0A0] block">Logistic Reg</span>
                        <span className="text-lg font-black font-mono text-[#F5F5F5]">
                          {comparativeResults.lr ?? 65}%
                        </span>
                        <span className="text-[9px] text-[#A0A0A0] block">Baseline (81.1%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Contributing Sensor Deviations */}
                  <div>
                    <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider mb-2.5 font-mono">
                      Contributing Sensor Factors (Z-Score Statistical Deviation)
                    </h4>
                    <div className="space-y-2">
                      {predictionResult.contributing_factors.map((factor) => (
                        <div
                          key={factor.feature}
                          className="p-3 rounded-2xl bg-[#121212] border border-[#66521A]/40 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                factor.severity === 'Critical'
                                  ? 'bg-rose-500 animate-pulse'
                                  : factor.severity === 'High'
                                  ? 'bg-orange-500'
                                  : factor.severity === 'Moderate'
                                  ? 'bg-[#FFD700]'
                                  : 'bg-emerald-400'
                              }`}
                            />
                            <div>
                              <span className="font-bold text-[#F5F5F5]">{factor.label}</span>
                              <span className="text-[10px] text-[#A0A0A0] block font-mono">
                                Safe Envelope: {factor.safe_range}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-[#F5F5F5]">
                              {factor.value} {factor.unit}
                            </span>
                            <span
                              className={`text-[10px] font-bold block ${
                                factor.deviation_pct > 0 ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {factor.deviation_pct > 0 ? `+${factor.deviation_pct}%` : `${factor.deviation_pct}%`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Maintenance Engineering Prescription */}
                <div className="p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#66521A]/50">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#FFD700]" />
                      <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider font-mono">
                        AI Recommended Maintenance Actions
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#A0A0A0]">Priority:</span>
                      <PriorityBadge priority={predictionResult.recommendations.maintenance_priority} />
                    </div>
                  </div>

                  {/* Warning signs & root cause */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-[#FFD700] block mb-1">
                        DETECTED ANOMALY PATTERNS:
                      </span>
                      <ul className="space-y-1 list-disc list-inside text-[#A0A0A0]">
                        {predictionResult.recommendations.warning_signs.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-[#D4AF37] block mb-1">
                        ROOT CAUSE HYPOTHESIS:
                      </span>
                      <ul className="space-y-1 list-disc list-inside text-[#A0A0A0]">
                        {predictionResult.recommendations.possible_issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                        RECOMMENDED ENGINEERING PROTOCOL:
                      </span>
                      <ul className="space-y-1 list-disc list-inside text-[#A0A0A0]">
                        {predictionResult.recommendations.recommended_actions.map((act, idx) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Spare parts & Schedule */}
                  <div className="p-3.5 rounded-2xl bg-[#121212] border border-[#66521A]/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[#A0A0A0] block">Suggested Schedule:</span>
                      <span className="text-[#F5F5F5] font-bold font-mono">
                        {predictionResult.recommendations.suggested_schedule}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        onOpenWorkOrderModal(
                          predictionResult.machine_id,
                          `Service Request: ${predictionResult.risk_category} condition on ${predictionResult.machine_id}`,
                          predictionResult.recommendations.recommended_actions.join('; '),
                          predictionResult.recommendations.maintenance_priority
                        )
                      }
                      className="btn-gold-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Create Work Order Now
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-16 rounded-3xl bg-[#1A1A1A] border border-[#66521A] text-center text-[#A0A0A0]">
                <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#D4AF37]" />
                <p className="text-sm">Enter telemetry parameters and run ML prediction</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* METHOD B: CSV BATCH UPLOAD */
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#66521A]/50">
              <div>
                <h3 className="text-base font-bold text-[#F5F5F5]">
                  Batch Telemetry CSV Processing
                </h3>
                <p className="text-xs text-[#A0A0A0]">
                  Upload multi-machine telemetry CSV file for high-throughput batch failure prediction
                </p>
              </div>

              <a
                href={getSampleCsvUrl()}
                download
                className="btn-gold-secondary flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample CSV Template
              </a>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-[#66521A] hover:border-[#D4AF37] rounded-3xl p-8 text-center transition-all bg-[#121212]">
              <Upload className="w-10 h-10 mx-auto mb-3 text-[#D4AF37]" />
              <p className="text-sm font-bold text-[#F5F5F5]">
                {csvFile ? csvFile.name : 'Choose a CSV file or drag and drop'}
              </p>
              <p className="text-xs text-[#A0A0A0] mt-1">
                Required columns: <code className="text-[#FFD700] font-mono">volt, rotate, pressure, vibration</code>
              </p>

              <label className="mt-4 inline-block px-4 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#262626] text-[#F5F5F5] text-xs font-bold cursor-pointer border border-[#66521A] transition-colors">
                Browse CSV File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {csvError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
                {csvError}
              </div>
            )}

            <button
              onClick={handleRunCsvBatch}
              disabled={!csvFile || isCsvUploading}
              className="w-full btn-gold-primary flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 transition-all disabled:opacity-50"
            >
              {isCsvUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing Batch Machine Telemetry...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Process Batch Inference
                </>
              )}
            </button>
          </div>

          {batchResults && (
            <div className="p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#66521A]/50">
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F5]">
                    Batch Inference Summary ({batchResults.total_processed} machines)
                  </h3>
                  <p className="text-xs text-[#A0A0A0]">
                    Average Health Score: {batchResults.summary.average_health_score}% • Critical Risk: {batchResults.summary.critical_pct}%
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold">
                    Healthy: {batchResults.summary.healthy}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-[#121212] text-[#FFD700] border border-[#66521A] font-bold">
                    Warning: {batchResults.summary.warning}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-500/30 font-bold">
                    Critical: {batchResults.summary.critical}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#121212] text-[#A0A0A0] uppercase font-mono text-[10px] border-b border-[#66521A]/50">
                    <tr>
                      <th className="py-2.5 px-3">Machine ID</th>
                      <th className="py-2.5 px-3">Condition</th>
                      <th className="py-2.5 px-3">Failure Prob (7d)</th>
                      <th className="py-2.5 px-3">Health Score</th>
                      <th className="py-2.5 px-3">Vibration</th>
                      <th className="py-2.5 px-3">Pressure</th>
                      <th className="py-2.5 px-3">Top Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#66521A]/30">
                    {batchResults.records.map((r, idx) => (
                      <tr key={idx} className="hover:bg-[#121212]/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#FFD700]">
                          {r.machine_id}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={r.risk_category} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          <span className={r.failure_probability >= 0.5 ? 'text-rose-400' : 'text-[#F5F5F5]'}>
                            {r.failure_probability_pct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#F5F5F5]">
                          {r.health_score}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#A0A0A0]">
                          {r.telemetry.vibration.toFixed(1)} mm/s
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#A0A0A0]">
                          {r.telemetry.pressure.toFixed(1)} psi
                        </td>
                        <td className="py-2.5 px-3 text-[#A0A0A0] max-w-xs truncate">
                          {r.recommendations.recommended_actions[0] || 'Nominal operation'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
