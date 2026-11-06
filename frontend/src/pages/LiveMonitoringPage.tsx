import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  Zap,
  Activity,
  Gauge,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Machine, LiveTelemetryResponse } from '../types';
import { fetchLiveTelemetry } from '../services/api';
import { playClickSound, playAlertSound } from '../utils/audio';

interface LiveMonitoringPageProps {
  machines: Machine[];
  initialMachineId?: string;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  machines,
  initialMachineId,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(initialMachineId || 'MCH-04');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [speedMs, setSpeedMs] = useState<number>(1200);

  // Injected anomaly offset states for presentation demonstrations
  const [anomalyOffset, setAnomalyOffset] = useState<{
    vib: number;
    press: number;
    volt: number;
  }>({ vib: 0, press: 0, volt: 0 });

  const [currentReading, setCurrentReading] = useState<LiveTelemetryResponse | null>(null);
  const [history, setHistory] = useState<
    Array<{
      time: string;
      volt: number;
      rotate: number;
      pressure: number;
      vibration: number;
    }>
  >([]);

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const poll = async () => {
      try {
        const data = await fetchLiveTelemetry(selectedMachineId);

        // Apply anomaly offsets if user injected any
        const adjustedReading = {
          ...data,
          readings: {
            ...data.readings,
            vibration: Number((data.readings.vibration + anomalyOffset.vib).toFixed(1)),
            pressure: Number((data.readings.pressure + anomalyOffset.press).toFixed(1)),
            volt: Number((data.readings.volt + anomalyOffset.volt).toFixed(1)),
          },
        };

        setCurrentReading(adjustedReading);

        setHistory((prev) => {
          const nowStr = new Date().toLocaleTimeString().split(' ')[0];
          const newPoint = {
            time: nowStr,
            volt: adjustedReading.readings.volt,
            rotate: adjustedReading.readings.rotate,
            pressure: adjustedReading.readings.pressure,
            vibration: adjustedReading.readings.vibration,
          };
          const updated = [...prev, newPoint];
          return updated.slice(-25);
        });

        // Decay injected anomalies smoothly back to baseline
        setAnomalyOffset((prev) => ({
          vib: Math.max(0, prev.vib * 0.85),
          press: Math.max(0, prev.press * 0.85),
          volt: Math.max(0, prev.volt * 0.85),
        }));
      } catch (err) {
        console.error('Error fetching live telemetry', err);
      }
    };

    poll();

    if (isStreaming) {
      timer = setInterval(poll, speedMs);
    }

    return () => clearInterval(timer);
  }, [selectedMachineId, isStreaming, speedMs, anomalyOffset]);

  const handleSelectMachine = (mId: string) => {
    playClickSound();
    setSelectedMachineId(mId);
    setHistory([]);
  };

  // Inject Anomaly Actions
  const injectVibrationAnomaly = () => {
    playAlertSound();
    setAnomalyOffset((prev) => ({ ...prev, vib: 26.5 }));
  };

  const injectPressureAnomaly = () => {
    playAlertSound();
    setAnomalyOffset((prev) => ({ ...prev, press: 32.0 }));
  };

  const injectVoltageAnomaly = () => {
    playAlertSound();
    setAnomalyOffset((prev) => ({ ...prev, volt: 28.0 }));
  };

  // Simulated FFT Harmonics
  const currentVib = currentReading?.readings.vibration ?? selectedMachine.vibration;
  const fftBars = [
    { freq: '1X (RPM)', amp: Math.min(100, Math.round(currentVib * 1.4)) },
    { freq: '2X Harmonic', amp: Math.min(100, Math.round(currentVib * 0.95)) },
    { freq: '3X Harmonic', amp: Math.min(100, Math.round(currentVib * 0.6)) },
    { freq: 'BPFO Bearing', amp: Math.min(100, currentVib > 45 ? 92 : 24) },
    { freq: 'BPFI Bearing', amp: Math.min(100, currentVib > 45 ? 86 : 18) },
    { freq: 'BSF Ball Spin', amp: Math.min(100, currentVib > 45 ? 78 : 12) },
    { freq: 'Gear Mesh', amp: Math.min(100, Math.round(currentVib * 0.45)) },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#66521A]/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] text-[#FFD700]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F5F5F5] tracking-tight">
              SCADA Real-Time Telemetry Streaming
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">
            Continuous high-frequency multi-sensor oscilloscope streaming, FFT harmonics analysis & threshold breach monitoring
          </p>
        </div>

        {/* Machine Selector & Stream Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedMachineId}
              onChange={(e) => handleSelectMachine(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-xs text-[#F5F5F5] font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer shadow-sm font-mono"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.name} ({m.status})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#A0A0A0] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              playClickSound();
              setIsStreaming(!isStreaming);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isStreaming
                ? 'bg-rose-950/60 text-rose-300 border-rose-500/50 hover:bg-rose-900/60'
                : 'btn-gold-primary'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause Stream
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Resume Stream
              </>
            )}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-[#66521A]/60 text-xs text-[#A0A0A0] font-mono">
            <button
              onClick={() => setSpeedMs(2000)}
              className={`px-2 py-1 rounded-lg ${speedMs === 2000 ? 'bg-[#1A1A1A] text-[#FFD700] border border-[#66521A] font-bold' : ''}`}
            >
              1x
            </button>
            <button
              onClick={() => setSpeedMs(1200)}
              className={`px-2 py-1 rounded-lg ${speedMs === 1200 ? 'bg-[#1A1A1A] text-[#FFD700] border border-[#66521A] font-bold' : ''}`}
            >
              2x
            </button>
            <button
              onClick={() => setSpeedMs(600)}
              className={`px-2 py-1 rounded-lg ${speedMs === 600 ? 'bg-[#1A1A1A] text-[#FFD700] border border-[#66521A] font-bold' : ''}`}
            >
              Turbo
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Anomaly Test Injection Console (Ideal for Presentation / Viva) */}
      <div className="p-4 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FFD700]" />
          <span className="text-[#F5F5F5] font-bold font-mono">
            Viva Anomaly Injection Console:
          </span>
          <span className="text-[#A0A0A0] hidden md:inline">
            Inject real-time telemetry spikes to test system alarm reaction live
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={injectVibrationAnomaly}
            className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold border border-rose-500/40 transition-all hover:scale-105 active:scale-95"
          >
            ⚡ Inject Vibration Spike (+26 mm/s)
          </button>
          <button
            onClick={injectPressureAnomaly}
            className="px-3 py-1.5 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] text-[#FFD700] font-bold border border-[#66521A] transition-all hover:scale-105 active:scale-95"
          >
            ⚡ Inject Pressure Surge (+32 psi)
          </button>
          <button
            onClick={injectVoltageAnomaly}
            className="px-3 py-1.5 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] text-[#D4AF37] font-bold border border-[#66521A] transition-all hover:scale-105 active:scale-95"
          >
            ⚡ Inject Voltage Spike (+28 V)
          </button>
        </div>
      </div>

      {/* Threshold Alerts Banner */}
      {currentReading?.threshold_alerts && currentReading.threshold_alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs space-y-1 animate-pulse shadow-xl shadow-rose-950/30">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>ACTIVE SENSOR THRESHOLD BREACH DETECTED:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 font-medium">
            {currentReading.threshold_alerts.map((alt, i) => (
              <li key={i}>{alt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Live Sensor Readout Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Voltage */}
        <div className="p-5 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-2">
          <div className="flex items-center justify-between text-[#A0A0A0] text-xs">
            <span className="flex items-center gap-1.5 font-bold">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              Line Voltage
            </span>
            <span className="text-[10px] text-[#A0A0A0]/70 font-mono">170.8 V</span>
          </div>
          <div className="text-3xl font-black font-mono text-[#F5F5F5]">
            {currentReading?.readings.volt.toFixed(1) ?? selectedMachine.volt.toFixed(1)}{' '}
            <span className="text-sm font-normal text-[#A0A0A0]">V</span>
          </div>
          <div className="text-[11px] text-[#A0A0A0] flex justify-between font-mono">
            <span>Envelope: 155-185V</span>
            <span className="text-[#FFD700] font-bold">Stable</span>
          </div>
        </div>

        {/* Rotation */}
        <div className="p-5 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-2">
          <div className="flex items-center justify-between text-[#A0A0A0] text-xs">
            <span className="flex items-center gap-1.5 font-bold">
              <Activity className="w-4 h-4 text-emerald-400" />
              Rotation Speed
            </span>
            <span className="text-[10px] text-[#A0A0A0]/70 font-mono">446.6 RPM</span>
          </div>
          <div className="text-3xl font-black font-mono text-[#F5F5F5]">
            {currentReading?.readings.rotate.toFixed(0) ?? selectedMachine.rotate.toFixed(0)}{' '}
            <span className="text-sm font-normal text-[#A0A0A0]">RPM</span>
          </div>
          <div className="text-[11px] text-[#A0A0A0] flex justify-between font-mono">
            <span>Envelope: 415-480</span>
            <span className="text-emerald-400 font-bold">Continuous</span>
          </div>
        </div>

        {/* Pressure */}
        <div className="p-5 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-2">
          <div className="flex items-center justify-between text-[#A0A0A0] text-xs">
            <span className="flex items-center gap-1.5 font-bold">
              <Gauge className="w-4 h-4 text-indigo-400" />
              Fluid Pressure
            </span>
            <span className="text-[10px] text-[#A0A0A0]/70 font-mono">100.9 psi</span>
          </div>
          <div className="text-3xl font-black font-mono text-[#F5F5F5]">
            {currentReading?.readings.pressure.toFixed(1) ?? selectedMachine.pressure.toFixed(1)}{' '}
            <span className="text-sm font-normal text-[#A0A0A0]">psi</span>
          </div>
          <div className="text-[11px] text-[#A0A0A0] flex justify-between font-mono">
            <span>Envelope: 90-112</span>
            <span className={(currentReading?.readings.pressure ?? selectedMachine.pressure) > 112 ? 'text-[#FFD700] font-bold' : 'text-[#A0A0A0]'}>
              {(currentReading?.readings.pressure ?? selectedMachine.pressure) > 112 ? 'Overpressure' : 'Nominal'}
            </span>
          </div>
        </div>

        {/* Vibration */}
        <div
          className={`p-5 rounded-3xl border shadow-xl space-y-2 ${
            (currentReading?.readings.vibration ?? selectedMachine.vibration) > 45
              ? 'bg-rose-950/50 border-rose-500/60 text-rose-200'
              : 'bg-[#1A1A1A] border-[#66521A]'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Vibration Velocity
            </span>
            <span className="text-[10px] text-[#A0A0A0] font-mono">Trip: 45 mm/s</span>
          </div>
          <div className="text-3xl font-black font-mono text-[#F5F5F5]">
            {currentReading?.readings.vibration.toFixed(1) ?? selectedMachine.vibration.toFixed(1)}{' '}
            <span className="text-sm font-normal text-[#A0A0A0]">mm/s</span>
          </div>
          <div className="text-[11px] flex justify-between font-mono">
            <span>ISO 10816 Class II</span>
            <span
              className={
                (currentReading?.readings.vibration ?? selectedMachine.vibration) > 45
                  ? 'text-rose-400 font-bold animate-pulse'
                  : 'text-emerald-400 font-bold'
              }
            >
              {(currentReading?.readings.vibration ?? selectedMachine.vibration) > 45
                ? 'TRIP EXCEEDED'
                : 'NORMAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Oscilloscope Waveforms (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vibration Waveform */}
        <div className="p-5 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <h3 className="text-sm font-bold text-[#F5F5F5] font-mono">Channel 1: Vibration Velocity (mm/s)</h3>
            </div>
            <span className="text-xs text-rose-400 font-mono font-bold">
              Trip Limit: 45.0 mm/s
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" stroke="#A0A0A0" fontSize={10} tickLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={10} domain={[20, 75]} tickLine={false} />
                <ReferenceLine y={45.0} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Trip limit', fill: '#EF4444', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#66521A', borderRadius: '12px', fontSize: '11px', color: '#F5F5F5' }} />
                <Line type="monotone" dataKey="vibration" stroke="#EF4444" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pressure Waveform */}
        <div className="p-5 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <h3 className="text-sm font-bold text-[#F5F5F5] font-mono">Channel 2: Fluid Pressure (psi)</h3>
            </div>
            <span className="text-xs text-indigo-400 font-mono font-bold">
              Ceiling: 115.0 psi
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" stroke="#A0A0A0" fontSize={10} tickLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={10} domain={[60, 150]} tickLine={false} />
                <ReferenceLine y={115.0} stroke="#818CF8" strokeDasharray="3 3" label={{ value: 'High limit', fill: '#818CF8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#66521A', borderRadius: '12px', fontSize: '11px', color: '#F5F5F5' }} />
                <Line type="monotone" dataKey="pressure" stroke="#818CF8" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voltage Waveform */}
        <div className="p-5 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></span>
              <h3 className="text-sm font-bold text-[#F5F5F5] font-mono">Channel 3: Voltage Waveform (V)</h3>
            </div>
            <span className="text-xs text-[#FFD700] font-mono font-bold">
              Nominal: 170.8 V
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" stroke="#A0A0A0" fontSize={10} tickLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={10} domain={[140, 220]} tickLine={false} />
                <ReferenceLine y={185.0} stroke="#D4AF37" strokeDasharray="3 3" />
                <ReferenceLine y={155.0} stroke="#D4AF37" strokeDasharray="3 3" />
                <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#66521A', borderRadius: '12px', fontSize: '11px', color: '#F5F5F5' }} />
                <Line type="monotone" dataKey="volt" stroke="#D4AF37" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rotation RPM Waveform */}
        <div className="p-5 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h3 className="text-sm font-bold text-[#F5F5F5] font-mono">Channel 4: Shaft Speed (RPM)</h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              Min: 415 RPM
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" stroke="#A0A0A0" fontSize={10} tickLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={10} domain={[300, 520]} tickLine={false} />
                <ReferenceLine y={415.0} stroke="#10B981" strokeDasharray="3 3" />
                <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#66521A', borderRadius: '12px', fontSize: '11px', color: '#F5F5F5' }} />
                <Line type="monotone" dataKey="rotate" stroke="#10B981" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FFT Harmonics & Frequency Spectrum Bar Visualizer */}
      <div className="p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#FFD700]" />
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F5] font-mono">
                FFT Harmonic Vibration Frequency Spectrum
              </h3>
              <p className="text-xs text-[#A0A0A0]">
                Fast Fourier Transform decomposition detecting bearing race defects (BPFO/BPFI)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#D4AF37]">Sampling Rate: 2.5 kHz</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 pt-2">
          {fftBars.map((b) => (
            <div key={b.freq} className="p-3 rounded-2xl bg-[#121212] border border-[#66521A]/50 text-center space-y-2">
              <span className="text-[10px] text-[#A0A0A0] font-mono block truncate">{b.freq}</span>
              <div className="h-20 flex items-end justify-center">
                <div
                  className={`w-5 rounded-t-lg transition-all duration-500 ${
                    b.amp > 80 ? 'bg-rose-500 shadow-lg shadow-rose-500/50' : b.amp > 50 ? 'bg-[#D4AF37]' : 'bg-[#FFD700]'
                  }`}
                  style={{ height: `${b.amp}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-[#F5F5F5] block">{b.amp}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
