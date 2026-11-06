import React, { useState } from 'react';
import {
  Activity,
  Bell,
  RefreshCw,
  Cpu,
  GraduationCap,
  ShieldCheck,
  User,
  Sliders,
  Volume2,
  VolumeX,
  AlertTriangle,
  Zap,
  Wifi,
} from 'lucide-react';
import { toggleAudioMute, isAudioMuted, playClickSound, playAlertSound } from '../utils/audio';

interface NavbarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  unreadAlertsCount: number;
  onOpenNotifications: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSimulateAnomaly?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  isRefreshing,
  unreadAlertsCount,
  onOpenNotifications,
  activeTab,
  setActiveTab,
  onSimulateAnomaly,
}) => {
  const [muted, setMuted] = useState<boolean>(isAudioMuted());
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleToggleAudio = () => {
    const newMuted = toggleAudioMute();
    setMuted(newMuted);
    if (!newMuted) playClickSound();
  };

  const handleAnomalyClick = () => {
    playAlertSound();
    setIsSimulating(true);
    if (onSimulateAnomaly) onSimulateAnomaly();
    setTimeout(() => setIsSimulating(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080808]/95 backdrop-blur-xl border-b border-[#66521A]/80 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Academic Major Project Title */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              playClickSound();
              setActiveTab('dashboard');
            }}
          >
            {/* Metallic Gold Glowing Brand Icon */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FFD700] via-[#D4AF37] to-[#AA820A] shadow-lg shadow-[#D4AF37]/25 group-hover:shadow-[#FFD700]/50 transition-all duration-300">
              <Cpu className="w-5 h-5 text-[#080808] animate-pulse" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#080808]"></div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#F5F5F5] font-mono flex items-center">
                  Opti<span className="text-[#D4AF37]">Mach</span>
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#D4AF37]/15 text-[#FFD700] border border-[#66521A] tracking-wider">
                    AI
                  </span>
                </span>
              </div>
              <p className="text-[10px] text-[#A0A0A0] hidden sm:block tracking-wide font-medium">
                Predict Failures • Protect Machines • Maximize Performance
              </p>
            </div>
          </div>

          {/* Academic Project Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#66521A] text-[#D4AF37] text-xs">
            <GraduationCap className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
            <span className="font-bold text-[#F5F5F5]">Major Project:</span>
            <span className="text-[#A0A0A0] truncate max-w-[260px]">
              ML-Based Predictive Maintenance
            </span>
          </div>
        </div>

        {/* Center: Live SCADA Telemetry Ticker */}
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#121212] border border-[#66521A]/70 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </span>
            <span className="text-[#A0A0A0] text-[11px] font-semibold">SCADA BUS:</span>
            <span className="text-[#10B981] font-bold font-mono text-[11px]">ONLINE (8 NODES)</span>
          </div>

          <span className="w-px h-3.5 bg-[#66521A]/60" />

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#F5F5F5]">
            <Activity className="w-3 h-3 text-[#D4AF37]" />
            <span>EFF: <strong className="text-[#FFD700]">94.8%</strong></span>
          </div>

          <span className="w-px h-3.5 bg-[#66521A]/60" />

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#F5F5F5]">
            <Zap className="w-3 h-3 text-[#D4AF37]" />
            <span>RF ML: <strong className="text-[#FFD700]">98.1%</strong></span>
          </div>
        </div>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Anomaly Simulation Button for Viva / Presentation */}
          <button
            onClick={handleAnomalyClick}
            title="Inject real-time vibration/pressure anomaly to test alert response"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSimulating
                ? 'bg-[#EF4444] text-white border-[#EF4444] animate-pulse shadow-lg shadow-[#EF4444]/40'
                : 'bg-[#2A0808] text-[#F87171] border-[#EF4444]/50 hover:bg-[#3D0C0C]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#F87171]" />
            <span>Simulate Anomaly</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleAudio}
            title={muted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
            className="p-2 rounded-xl text-[#D4AF37] bg-[#121212] hover:bg-[#1A1A1A] border border-[#66521A] hover:border-[#D4AF37] transition-all shadow-sm"
          >
            {muted ? <VolumeX className="w-4 h-4 text-[#A0A0A0]" /> : <Volume2 className="w-4 h-4 text-[#FFD700]" />}
          </button>

          {/* Refresh Data button */}
          <button
            onClick={() => {
              playClickSound();
              onRefresh();
            }}
            disabled={isRefreshing}
            title="Refresh Factory Data & Model Inference"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#F5F5F5] bg-[#121212] hover:bg-[#1A1A1A] border border-[#66521A] hover:border-[#D4AF37] transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FFD700]' : 'text-[#D4AF37]'}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => {
              playClickSound();
              onOpenNotifications();
            }}
            title="View Industrial Alerts & Diagnostics"
            className="relative p-2 rounded-xl text-[#F5F5F5] bg-[#121212] hover:bg-[#1A1A1A] border border-[#66521A] hover:border-[#D4AF37] transition-all shadow-sm"
          >
            <Bell className="w-4 h-4 text-[#D4AF37]" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white shadow-lg animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Pill */}
          <div
            onClick={() => {
              playClickSound();
              setActiveTab('settings');
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] border border-[#66521A] hover:border-[#D4AF37] cursor-pointer transition-all shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FFD700] via-[#D4AF37] to-[#AA820A] flex items-center justify-center text-[#080808] font-black text-xs shadow-md">
              AM
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-[#F5F5F5] leading-tight">Eng. Alex Mercer</div>
              <div className="text-[10px] text-[#D4AF37] leading-tight font-medium">Reliability Lead</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
