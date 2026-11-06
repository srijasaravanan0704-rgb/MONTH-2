import React, { useState } from 'react';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  Wrench,
  Activity,
  ArrowUpRight,
  Box,
  Sliders,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { DashboardStats, DashboardAnalytics, Machine, MaintenanceRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CircularGauge } from '../components/CircularGauge';
import { playClickSound } from '../utils/audio';

interface DashboardPageProps {
  stats: DashboardStats | null;
  analytics: DashboardAnalytics | null;
  machines: Machine[];
  maintenanceRecords: MaintenanceRecord[];
  onSelectMachineForPredict: (machine: Machine) => void;
  onNavigateToTab: (tab: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Healthy: '#10B981',
  Warning: '#D4AF37',
  'High Risk': '#F97316',
  Critical: '#EF4444',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  analytics,
  machines,
  onSelectMachineForPredict,
  onNavigateToTab,
}) => {
  const [selectedSensorMetric, setSelectedSensorMetric] = useState<'vibration' | 'pressure' | 'volt' | 'rotate' | 'failure_risk_index'>('vibration');

  // KPI Data
  const total = stats?.total_machines ?? machines.length;
  const healthy = stats?.healthy_machines ?? machines.filter((m) => m.status === 'Healthy').length;
  const atRisk = stats?.machines_at_risk ?? machines.filter((m) => m.status === 'Warning' || m.status === 'High Risk').length;
  const critical = stats?.critical_machines ?? machines.filter((m) => m.status === 'Critical').length;
  const predictedFailures = stats?.predicted_failures ?? machines.filter((m) => m.failure_prob >= 0.5).length;
  const maintDue = stats?.maintenance_required ?? 3;

  // Pie chart data
  const pieData = analytics?.health_distribution && analytics.health_distribution.length > 0
    ? analytics.health_distribution
    : [
        { status: 'Healthy', count: healthy },
        { status: 'Warning', count: atRisk - (stats?.high_risk_machines ?? 1) },
        { status: 'High Risk', count: stats?.high_risk_machines ?? 1 },
        { status: 'Critical', count: critical },
      ];

  const trendData = analytics?.sensor_parameter_trends ?? [];

  // Machine Risk comparison sorted by failure prob descending
  const riskComparisonData = [...machines]
    .sort((a, b) => b.failure_prob - a.failure_prob)
    .slice(0, 6)
    .map((m) => ({
      name: m.id,
      riskPct: Math.round(m.failure_prob * 100),
      healthScore: Math.round(m.health_score),
      status: m.status,
    }));

  const metricConfigs = {
    vibration: { label: 'Vibration', unit: 'mm/s', stroke: '#EF4444', fill: '#EF4444', threshold: 45.0 },
    pressure: { label: 'Pressure', unit: 'psi', stroke: '#818CF8', fill: '#818CF8', threshold: 115.0 },
    volt: { label: 'Voltage', unit: 'V', stroke: '#D4AF37', fill: '#D4AF37', threshold: 185.0 },
    rotate: { label: 'RPM', unit: 'RPM', stroke: '#10B981', fill: '#10B981', threshold: 415.0 },
    failure_risk_index: { label: 'Risk Index', unit: '%', stroke: '#FFD700', fill: '#FFD700', threshold: 50.0 },
  };

  const currConfig = metricConfigs[selectedSensorMetric];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero Command Center Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#1A1A1A] border border-[#66521A] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-80 h-80 rounded-full bg-[#FFD700]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121212] border border-[#66521A] text-[#FFD700] text-xs font-bold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]"></span>
              </span>
              MICROSOFT AZURE BENCHMARK • CONTINUOUS 7-DAY PREDICTION HORIZON
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight">
              OptiMach Industrial AI Monitoring
            </h1>

            <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed font-normal">
              Continuous multi-sensor telemetry anomaly detection, predictive failure hazard forecasting, and automated maintenance dispatch calibrated against the Microsoft Azure Predictive Maintenance benchmark.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                playClickSound();
                onNavigateToTab('3d-twin');
              }}
              className="btn-gold-primary flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-[#D4AF37]/20"
            >
              <Box className="w-4 h-4" />
              Launch 3D Digital Twin
            </button>
            <button
              onClick={() => {
                playClickSound();
                onNavigateToTab('predictive-ai');
              }}
              className="btn-gold-secondary flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold"
            >
              <Sliders className="w-4 h-4 text-[#D4AF37]" />
              AI Sensor Inference
            </button>
          </div>
        </div>

        {/* Live Anomaly Ticker Bar */}
        <div className="mt-6 pt-4 border-t border-[#66521A]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-300 font-semibold">
            <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>CRITICAL ALERT: Machine MCH-04 Vibration Spike (58.7 mm/s) exceeds ISO 10816 threshold</span>
          </div>

          <button
            onClick={() => {
              playClickSound();
              onNavigateToTab('maintenance');
            }}
            className="text-xs text-[#D4AF37] hover:text-[#FFD700] font-bold flex items-center gap-1 transition-colors"
          >
            Review Urgent Work Orders &rarr;
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Machines */}
        <div
          onClick={() => {
            playClickSound();
            onNavigateToTab('machines');
          }}
          className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] hover:border-[#D4AF37] cursor-pointer transition-all hover:-translate-y-1 shadow-xl group"
        >
          <div className="flex items-center justify-between text-[#A0A0A0] mb-2">
            <span className="text-xs font-semibold">Total Fleet</span>
            <Server className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F5F5F5]">{total} Units</div>
          <div className="text-[11px] text-[#D4AF37] font-medium mt-1">100% active stream</div>
        </div>

        {/* Healthy Machines */}
        <div
          onClick={() => {
            playClickSound();
            onNavigateToTab('machines');
          }}
          className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] hover:border-emerald-500/60 cursor-pointer transition-all hover:-translate-y-1 shadow-xl group"
        >
          <div className="flex items-center justify-between text-[#A0A0A0] mb-2">
            <span className="text-xs font-semibold">Healthy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{healthy} Units</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-0.5 font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>{Math.round((healthy / Math.max(total, 1)) * 100)}% optimal state</span>
          </div>
        </div>

        {/* Machines at Risk */}
        <div
          onClick={() => {
            playClickSound();
            onNavigateToTab('machines');
          }}
          className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] hover:border-[#D4AF37] cursor-pointer transition-all hover:-translate-y-1 shadow-xl group"
        >
          <div className="flex items-center justify-between text-[#A0A0A0] mb-2">
            <span className="text-xs font-semibold">At Risk / Warn</span>
            <AlertTriangle className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#FFD700]">{atRisk} Units</div>
          <div className="text-[11px] text-[#D4AF37]/80 mt-1 font-medium">Elevated watch</div>
        </div>

        {/* Critical Machines */}
        <div
          onClick={() => {
            playClickSound();
            onNavigateToTab('machines');
          }}
          className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] hover:border-rose-500/60 cursor-pointer transition-all hover:-translate-y-1 shadow-xl group relative overflow-hidden"
        >
          {critical > 0 && (
            <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping m-2.5" />
          )}
          <div className="flex items-center justify-between text-[#A0A0A0] mb-2">
            <span className="text-xs font-semibold">Critical Trip</span>
            <AlertOctagon className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-500">{critical} Unit</div>
          <div className="text-[11px] text-rose-400 font-bold mt-1">Shutdown risk</div>
        </div>

        {/* Predicted Failures (7-day horizon) */}
        <div
          onClick={() => {
            playClickSound();
            onNavigateToTab('predictive-ai');
          }}
          className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] hover:border-[#D4AF37] cursor-pointer transition-all hover:-translate-y-1 shadow-xl group"
        >
          <div className="flex items-center justify-between text-[#A0A0A0] mb-2">
            <span className="text-xs font-semibold">7d Failure Odds</span>
            <TrendingUp className="w-4 h-4 text-[#FFD700] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#D4AF37]">{predictedFailures} Units</div>
          <div className="text-[11px] text-[#D4AF37]/80 mt-1 font-medium">ML projected &gt;50%</div>
        </div>

        {/* Maintenance Required */}
        <div
          onClick={() => {
            playClickSound();
            onNavigateToTab('maintenance');
          }}
          className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] hover:border-[#D4AF37] cursor-pointer transition-all hover:-translate-y-1 shadow-xl group"
        >
          <div className="flex items-center justify-between text-[#A0A0A0] mb-2">
            <span className="text-xs font-semibold">Work Orders</span>
            <Wrench className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F5F5F5]">{maintDue} Orders</div>
          <div className="text-[11px] text-[#A0A0A0] mt-1 font-medium">Scheduled & active</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Trends & Anomaly Prediction Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-2xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#D4AF37]" />
                Factory Multi-Sensor Telemetry & Failure Risk Trends
              </h2>
              <p className="text-xs text-[#A0A0A0]">
                7-Day chronological progression across industrial sensors
              </p>
            </div>

            {/* Metric Selector Buttons */}
            <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#66521A]/60 text-xs">
              {(
                [
                  { id: 'vibration', label: 'Vibration', color: '#EF4444' },
                  { id: 'pressure', label: 'Pressure', color: '#818CF8' },
                  { id: 'volt', label: 'Voltage', color: '#D4AF37' },
                  { id: 'rotate', label: 'RPM', color: '#10B981' },
                  { id: 'failure_risk_index', label: 'Risk %', color: '#FFD700' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    playClickSound();
                    setSelectedSensorMetric(m.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedSensorMetric === m.id
                      ? 'bg-[#1A1A1A] border border-[#66521A] text-[#F5F5F5] font-bold shadow-sm'
                      : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                  }`}
                  style={{
                    color: selectedSensorMetric === m.id ? m.color : undefined,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currConfig.fill} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={currConfig.fill} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="date" stroke="#A0A0A0" fontSize={11} tickLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={11} tickLine={false} />
                <ReferenceLine
                  y={currConfig.threshold}
                  stroke={currConfig.stroke}
                  strokeDasharray="4 4"
                  label={{ value: 'Safety limit', fill: currConfig.stroke, fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    borderColor: '#66521A',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F5F5F5',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedSensorMetric}
                  stroke={currConfig.stroke}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#metricGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-[#66521A]/50 flex items-center justify-between text-xs text-[#A0A0A0]">
            <span>Nominal baseline: Vibration &lt; 44 mm/s • Pressure 90-112 psi • RPM ~ 446</span>
            <span className="text-[#D4AF37] font-mono">Sampling: 15-min Intervals</span>
          </div>
        </div>

        {/* Machine Health Distribution (Donut Chart) */}
        <div className="p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              Machine Fleet Health Breakdown
            </h2>
            <p className="text-xs text-[#A0A0A0]">Condition distribution across 8 industrial stations</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#A0A0A0'}
                      stroke="#121212"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    borderColor: '#66521A',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F5F5F5',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {pieData.map((d) => (
              <div
                key={d.status}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#121212] border border-[#66521A]/50"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[d.status] || '#A0A0A0' }}
                  />
                  <span className="text-[#A0A0A0] font-medium">{d.status}</span>
                </div>
                <span className="font-mono font-bold text-[#F5F5F5]">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Machine Health Cards & Machine-wise Risk Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Health Overview (4 Cards) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#D4AF37]" />
                Equipment Health Overview
              </h2>
              <p className="text-xs text-[#A0A0A0]">
                Operating status and telemetry health indicators for industrial equipment
              </p>
            </div>
            <button
              onClick={() => {
                playClickSound();
                onNavigateToTab('machines');
              }}
              className="text-xs text-[#D4AF37] hover:text-[#FFD700] flex items-center gap-1 font-semibold"
            >
              View Full Fleet
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {machines.slice(0, 4).map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  playClickSound();
                  onSelectMachineForPredict(m);
                }}
                className="p-4 rounded-2xl bg-[#121212] border border-[#66521A]/50 hover:border-[#D4AF37] cursor-pointer transition-all hover:-translate-y-1 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#D4AF37]">{m.id}</span>
                      <StatusBadge status={m.status} size="sm" />
                    </div>
                    <h4 className="text-sm font-bold text-[#F5F5F5] mt-1 group-hover:text-[#FFD700] transition-colors">
                      {m.name}
                    </h4>
                    <span className="text-[11px] text-[#A0A0A0]">{m.location}</span>
                  </div>

                  <CircularGauge
                    value={m.health_score}
                    size={56}
                    strokeWidth={5}
                    isRisk={false}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-[#66521A]/40 grid grid-cols-4 gap-1 text-center font-mono">
                  <div className="bg-[#1A1A1A] py-1 px-1 rounded-lg border border-[#262626]">
                    <span className="text-[9px] text-[#A0A0A0] block font-sans">Volt</span>
                    <span className="text-xs text-[#F5F5F5] font-bold">{m.volt.toFixed(0)}V</span>
                  </div>
                  <div className="bg-[#1A1A1A] py-1 px-1 rounded-lg border border-[#262626]">
                    <span className="text-[9px] text-[#A0A0A0] block font-sans">RPM</span>
                    <span className="text-xs text-[#F5F5F5] font-bold">{m.rotate.toFixed(0)}</span>
                  </div>
                  <div className="bg-[#1A1A1A] py-1 px-1 rounded-lg border border-[#262626]">
                    <span className="text-[9px] text-[#A0A0A0] block font-sans">Press</span>
                    <span className="text-xs text-[#F5F5F5] font-bold">{m.pressure.toFixed(0)}</span>
                  </div>
                  <div className={`py-1 px-1 rounded-lg border ${m.vibration > 45 ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-[#1A1A1A] border-[#262626] text-[#F5F5F5]'}`}>
                    <span className="text-[9px] text-[#A0A0A0] block font-sans">Vib</span>
                    <span className="text-xs font-bold">{m.vibration.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Machine-wise Failure Risk Comparison Bar Chart */}
        <div className="p-6 rounded-3xl bg-[#1A1A1A] border border-[#66521A] shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              Machine Failure Probability (7d)
            </h2>
            <p className="text-xs text-[#A0A0A0]">Ranked by highest predictive failure risk</p>
          </div>

          <div className="h-60 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskComparisonData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#A0A0A0" fontSize={10} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#A0A0A0" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    borderColor: '#66521A',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F5F5F5',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Failure Probability']}
                />
                <Bar dataKey="riskPct" radius={[0, 4, 4, 0]}>
                  {riskComparisonData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={entry.riskPct >= 75 ? '#EF4444' : entry.riskPct >= 50 ? '#F97316' : entry.riskPct >= 25 ? '#D4AF37' : '#10B981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#121212] border border-[#66521A]/50 text-xs text-[#A0A0A0] flex items-center justify-between">
            <span>Machine MCH-04 exhibits 88% risk</span>
            <button
              onClick={() => {
                playClickSound();
                onNavigateToTab('maintenance');
              }}
              className="text-[#D4AF37] hover:text-[#FFD700] font-bold"
            >
              Dispatch Crew &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
