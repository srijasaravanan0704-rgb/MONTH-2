import React from 'react';

interface CircularGaugeProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  isRisk?: boolean; // if true, higher is worse (red), if false higher is better (green)
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  size = 120,
  strokeWidth = 10,
  label = '',
  sublabel = '',
  color,
  isRisk = false,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc angle 270 degrees
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (clampedValue / 100) * arcLength;

  let gaugeColor = color;
  if (!gaugeColor) {
    if (isRisk) {
      if (clampedValue >= 75) gaugeColor = '#EF4444'; // Red
      else if (clampedValue >= 50) gaugeColor = '#F97316'; // Orange
      else if (clampedValue >= 25) gaugeColor = '#FFD700'; // Bright Gold / Warning
      else gaugeColor = '#10B981'; // Green
    } else {
      if (clampedValue >= 85) gaugeColor = '#D4AF37'; // Metallic Gold / Optimal
      else if (clampedValue >= 65) gaugeColor = '#FFD700'; // Bright Gold
      else if (clampedValue >= 40) gaugeColor = '#F97316'; // Orange
      else gaugeColor = '#EF4444'; // Red
    }
  }

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-135 overflow-visible"
        style={{ transformOrigin: 'center' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Value track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${gaugeColor}55)`,
          }}
        />
      </svg>
      {/* Central readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tracking-tight text-[#F5F5F5] font-mono">
          {clampedValue.toFixed(1)}%
        </span>
        {label && <span className="text-[10px] uppercase font-bold text-[#D4AF37] mt-0.5 tracking-wider">{label}</span>}
        {sublabel && <span className="text-[9px] text-[#A0A0A0]">{sublabel}</span>}
      </div>
    </div>
  );
};
