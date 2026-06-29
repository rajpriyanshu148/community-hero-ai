import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  variant?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'gradient' | 'civic';
  size?: 'xs' | 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  className?: string;
  trackClassName?: string;
}

const variantGradients = {
  cyan: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
  emerald: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
  amber: 'bg-gradient-to-r from-amber-600 to-amber-400',
  red: 'bg-gradient-to-r from-red-600 to-red-400',
  purple: 'bg-gradient-to-r from-purple-600 to-purple-400',
  gradient: 'bg-gradient-to-r from-cyan-600 via-emerald-500 to-cyan-400',
  civic: 'bg-gradient-to-r from-cyan-500 to-emerald-500',
};

const sizeMap = {
  xs: 'h-1',
  sm: 'h-1.5',
  default: 'h-2.5',
  lg: 'h-4',
};

export function Progress({
  value,
  max = 100,
  variant = 'cyan',
  size = 'default',
  showLabel = false,
  label,
  animated = true,
  striped = false,
  className,
  trackClassName,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400">{label}</span>
          <span className="text-xs font-semibold text-white">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-slate-800/80 overflow-hidden',
          sizeMap[size],
          trackClassName
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full',
            variantGradients[variant],
            animated && 'progress-bar-animated',
            striped && 'bg-stripes'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          style={{ boxShadow: `0 0 8px rgba(6, 182, 212, 0.5)` }}
        />
      </div>
    </div>
  );
}

// XP Progress Bar with level display
interface XPProgressProps {
  currentXP: number;
  xpForNext: number;
  level: number;
  className?: string;
}

export function XPProgress({ currentXP, xpForNext, level, className }: XPProgressProps) {
  const percentage = (currentXP / xpForNext) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            LVL {level}
          </span>
          <span className="text-xs text-slate-400">
            {currentXP.toLocaleString()} / {xpForNext.toLocaleString()} XP
          </span>
        </div>
        <span className="text-xs text-slate-400">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 progress-bar-animated"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}
        />
      </div>
    </div>
  );
}

// Circular Progress
interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CircularProgress({
  value,
  size = 60,
  strokeWidth = 5,
  color = '#06B6D4',
  trackColor = 'rgba(51,65,85,0.5)',
  children,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
