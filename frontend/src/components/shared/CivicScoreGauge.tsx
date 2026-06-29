'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CivicScoreGaugeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

function getScoreColor(score: number): { color: string; glow: string; label: string } {
  if (score >= 81) return { color: '#EF4444', glow: 'rgba(239,68,68,0.4)', label: 'CRITICAL' };
  if (score >= 61) return { color: '#F59E0B', glow: 'rgba(245,158,11,0.4)', label: 'HIGH' };
  if (score >= 31) return { color: '#06B6D4', glow: 'rgba(6,182,212,0.4)', label: 'MEDIUM' };
  return { color: '#10B981', glow: 'rgba(16,185,129,0.4)', label: 'LOW' };
}

const sizeConfig = {
  sm: { size: 80, stroke: 6, fontSize: 18, labelSize: 9 },
  md: { size: 120, stroke: 8, fontSize: 26, labelSize: 11 },
  lg: { size: 160, stroke: 10, fontSize: 34, labelSize: 12 },
  xl: { size: 200, stroke: 12, fontSize: 42, labelSize: 14 },
};

export function CivicScoreGauge({
  score,
  size = 'md',
  showLabel = true,
  label = 'Civic Emergency Score',
  className,
  animated = true,
}: CivicScoreGaugeProps) {
  const config = sizeConfig[size];
  const { color, glow, label: scoreLabel } = getScoreColor(score);

  // Arc calculation (270° sweep, starts at 135°)
  const radius = (config.size - config.stroke) / 2;
  const startAngle = 135;
  const sweepAngle = 270;
  const totalArcLength = (sweepAngle / 360) * 2 * Math.PI * radius;
  const filledArcLength = (score / 100) * totalArcLength;

  // Convert angle to SVG arc path
  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const start = polarToCartesian(cx, cy, r, startDeg);
    const end = polarToCartesian(cx, cy, r, endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const cx = config.size / 2;
  const cy = config.size / 2;
  const trackPath = arcPath(cx, cy, radius, startAngle, startAngle + sweepAngle);
  const progressPath = arcPath(cx, cy, radius, startAngle, startAngle + (score / 100) * sweepAngle);

  // Zone indicators
  const zones = [
    { label: 'LOW', start: startAngle, end: startAngle + sweepAngle * 0.3, color: '#10B981' },
    { label: 'MED', start: startAngle + sweepAngle * 0.3, end: startAngle + sweepAngle * 0.6, color: '#06B6D4' },
    { label: 'HIGH', start: startAngle + sweepAngle * 0.6, end: startAngle + sweepAngle * 0.8, color: '#F59E0B' },
    { label: 'CRIT', start: startAngle + sweepAngle * 0.8, end: startAngle + sweepAngle, color: '#EF4444' },
  ];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {label && showLabel && (
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest text-center">
          {label}
        </p>
      )}

      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg width={config.size} height={config.size} className="overflow-visible">
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(51,65,85,0.5)"
            strokeWidth={config.stroke}
            strokeLinecap="round"
          />

          {/* Zone markers (thin lines) */}
          {zones.map((zone, i) => (
            <path
              key={i}
              d={arcPath(cx, cy, radius, zone.start, zone.end)}
              fill="none"
              stroke={zone.color}
              strokeWidth={config.stroke / 3}
              strokeLinecap="round"
              opacity={0.25}
            />
          ))}

          {/* Progress Arc */}
          <motion.path
            d={progressPath}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={animated ? { duration: 1.2, ease: 'easeOut', delay: 0.3 } : { duration: 0 }}
            style={{
              filter: `drop-shadow(0 0 ${config.stroke * 1.5}px ${glow})`,
            }}
          />

          {/* Score in center */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={config.fontSize}
            fontWeight="700"
            fontFamily="Space Grotesk, sans-serif"
            fill={color}
            style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
          >
            {score}
          </text>

          {/* Label below score */}
          <text
            x={cx}
            y={cy + config.fontSize / 2 + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={config.labelSize}
            fontWeight="600"
            fontFamily="Space Grotesk, sans-serif"
            fill={color}
            letterSpacing="2"
          >
            {scoreLabel}
          </text>

          {/* Min/Max labels */}
          {size !== 'sm' && (
            <>
              <text
                x={polarToCartesian(cx, cy, radius + config.stroke * 1.5, startAngle).x}
                y={polarToCartesian(cx, cy, radius + config.stroke * 1.5, startAngle).y}
                textAnchor="middle"
                fontSize={8}
                fill="#64748B"
                fontFamily="Inter, sans-serif"
              >
                0
              </text>
              <text
                x={polarToCartesian(cx, cy, radius + config.stroke * 1.5, startAngle + sweepAngle).x}
                y={polarToCartesian(cx, cy, radius + config.stroke * 1.5, startAngle + sweepAngle).y}
                textAnchor="middle"
                fontSize={8}
                fill="#64748B"
                fontFamily="Inter, sans-serif"
              >
                100
              </text>
            </>
          )}
        </svg>

        {/* Pulse effect for critical scores */}
        {score >= 81 && (
          <div
            className="absolute inset-0 rounded-full animate-ping-slow"
            style={{
              background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
              opacity: 0.3,
            }}
          />
        )}
      </div>

      {/* Zone Legend */}
      {size === 'xl' && (
        <div className="flex items-center gap-3 mt-3">
          {zones.map((zone) => (
            <div key={zone.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: zone.color }} />
              <span className="text-[10px] text-slate-500">{zone.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
