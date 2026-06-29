'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TrustScoreRingProps {
  score: number;
  level: number;
  size?: number;
  strokeWidth?: number;
}

export const TrustScoreRing: React.FC<TrustScoreRingProps> = ({
  score,
  level,
  size = 120,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Determine color based on score
  const getColor = (val: number) => {
    if (val >= 80) return 'stroke-emerald-500';
    if (val >= 50) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          className="stroke-slate-800"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <motion.circle
          className={`transition-all duration-1000 ease-out ${getColor(score)}`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Level and Score display */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tracking-tight text-white">{Math.round(score)}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          Level {level}
        </span>
      </div>
    </div>
  );
};
