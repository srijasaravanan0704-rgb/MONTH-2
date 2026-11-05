import React from 'react';
import {
  LayoutDashboard,
  Box,
  Server,
  BrainCircuit,
  LineChart,
  Radio,
  CalendarClock,
  FileText,
  Settings,
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  predictedFailuresCount: number;
  maintenanceDueCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  predictedFailuresCount,
  maintenanceDueCount,
}) => {
  const sections = [
    {
      group: 'Overview & Digital Twin',
      items: [
        {
          id: 'dashboard',
          label: 'Main Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: '3d-twin',
          label: '3D Factory Twin',
          icon: Box,
          badge: '3D Live',
          badgeColor: 'bg-[#241C0A] text-[#FFD700] border-[#66521A]',
        },
        {
          id: 'machines',
          label: 'Machine Fleet',
          icon: Server,
          badge: null,
        },
      ],
    },
    {
      group: 'Industrial AI & Edge',
      items: [
        {
          id: 'predictive-ai',
          label: 'Predictive Analysis',
          icon: BrainCircuit,
          badge: 'Core AI',
          badgeColor: 'bg-[#241C0A] text-[#D4AF37] border-[#66521A]',
        },
        {
          id: 'ml-evaluation',
          label: 'ML Model Metrics',
          icon: LineChart,
          badge: 'Azure PM',
          badgeColor: 'bg-[#1A1A1A] text-[#FFD700] border-[#66521A]',
        },
        {
          id: 'live-monitoring',
          label: 'Live Telemetry',
          icon: Radio,
          badge: 'Streaming',
          badgeColor: 'bg-[#0A2012] text-[#34D399] border-[#059669]/50',
        },
      ],
    },
    {
      group: 'Plant Maintenance & Audits',
      items: [
        {
          id: 'maintenance',
          label: 'Maintenance Hub',
          icon: CalendarClock,
          badge: maintenanceDueCount > 0 ? `${maintenanceDueCount} Due` : null,
          badgeColor: 'bg-[#2B1505] text-[#FB923C] border-[#F97316]/60',
        },
        {
          id: 'reports',
          label: 'Industrial Reports',
          icon: FileText,
          badge: 'PDF / CSV',
          badgeColor: 'bg-[#241C0A] text-[#D4AF37] border-[#66521A]',
        },
        {
          id: 'settings',
          label: 'System Settings',
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#080808]/95 border-r border-[#66521A]/80 flex flex-col justify-between shrink-0 select-none backdrop-blur-md">
      <div className="p-3 space-y-4">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-[#A0A0A0] uppercase font-mono">
              {sec.group}
            </div>

            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playClickSound();
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4AF37]/25 via-[#D4AF37]/10 to-transparent text-[#F5F5F5] border-l-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                      : 'text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? 'text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]'
                          : 'text-[#A0A0A0] group-hover:text-[#D4AF37]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-wide uppercase ${
                        item.badgeColor || 'bg-[#1A1A1A] text-[#A0A0A0] border-[#333333]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Academic Project Status Card */}
      <div className="p-3.5 m-3 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
            Active Model
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
        </div>

        <p className="text-xs font-bold text-[#F5F5F5] leading-tight">
          Random Forest Classifier
        </p>
        <p className="text-[10px] text-[#A0A0A0] font-mono">
          Azure PM Benchmark • Acc: <strong className="text-[#34D399]">98.1%</strong>
        </p>

        <div className="pt-2 border-t border-[#66521A]/50 flex items-center justify-between text-[10px] text-[#A0A0A0]">
          <span>7-Day Failure Horizon</span>
          <span className="px-1.5 py-0.2 rounded bg-[#241C0A] text-[#FFD700] font-mono border border-[#66521A]">
            v2.4
          </span>
        </div>
      </div>
    </aside>
  );
};
