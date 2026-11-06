import React from 'react';
import { MachineStatus, MaintenancePriority } from '../types';

interface StatusBadgeProps {
  status: MachineStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showPulse = true,
}) => {
  let bg = 'bg-[#1A1A1A] text-[#A0A0A0] border-[#66521A]/50';
  let dotColor = 'bg-[#A0A0A0]';
  let pulseColor = 'bg-[#A0A0A0]';

  switch (status) {
    case 'Healthy':
      bg = 'bg-[#0A2012]/90 text-[#34D399] border-[#059669]/40';
      dotColor = 'bg-[#10B981]';
      pulseColor = 'bg-[#10B981]';
      break;
    case 'Warning':
      bg = 'bg-[#241C0A]/95 text-[#FFD700] border-[#D4AF37]/60';
      dotColor = 'bg-[#FFD700]';
      pulseColor = 'bg-[#FFD700]';
      break;
    case 'High Risk':
      bg = 'bg-[#2B1505]/95 text-[#FB923C] border-[#F97316]/60';
      dotColor = 'bg-[#F97316]';
      pulseColor = 'bg-[#F97316]';
      break;
    case 'Critical':
      bg = 'bg-[#2A0808]/95 text-[#F87171] border-[#EF4444]/60';
      dotColor = 'bg-[#EF4444]';
      pulseColor = 'bg-[#EF4444]';
      break;
    default:
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-bold px-3 py-1.5',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md ${bg} ${sizeClasses}`}>
      <span className="relative flex h-2 w-2">
        {showPulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
      </span>
      <span className="tracking-wide">{status}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: MaintenancePriority | string }> = ({ priority }) => {
  let classes = 'bg-[#1A1A1A] text-[#A0A0A0] border-[#333333]';
  switch (priority) {
    case 'Urgent':
      classes = 'bg-[#2A0808] text-[#F87171] border-[#EF4444]/70 animate-pulse';
      break;
    case 'High':
      classes = 'bg-[#2B1505] text-[#FB923C] border-[#F97316]/60 font-semibold';
      break;
    case 'Medium':
      classes = 'bg-[#241C0A] text-[#FFD700] border-[#D4AF37]/60 font-semibold';
      break;
    case 'Low':
      classes = 'bg-[#121212] text-[#D4AF37] border-[#66521A]';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded border ${classes}`}>
      {priority}
    </span>
  );
};
