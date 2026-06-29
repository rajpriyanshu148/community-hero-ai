'use client';

import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Card } from '../ui/card';

interface WardHealthCardProps {
  wardName: string;
  score: number;
  topCategory?: string;
  totalActive?: number;
}

export const WardHealthCard: React.FC<WardHealthCardProps> = ({
  wardName,
  score,
  topCategory = 'None',
  totalActive = 0,
}) => {
  const getColorClass = (val: number) => {
    if (val >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (val >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const getStatusText = (val: number) => {
    if (val >= 80) return 'Healthy Ward';
    if (val >= 50) return 'Needs Attention';
    return 'Critical State';
  };

  return (
    <Card className="glass p-5 border-slate-800 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Hyperlocal Index
          </span>
          <h4 className="text-base font-bold text-white tracking-tight">{wardName}</h4>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getColorClass(score)}`}>
          <Shield className="w-3.5 h-3.5" />
          <span>{score}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Status:</span>
          <span className="font-bold text-white">{getStatusText(score)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Active Issues:</span>
          <span className="font-bold text-slate-200">{totalActive}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Primary Issue:</span>
          <span className="font-bold text-slate-200">{topCategory.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-2 bg-slate-900/60 rounded-lg text-[10px] text-slate-500 font-semibold mt-1">
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span>Predictive Watchtower updates live every 24 hours.</span>
      </div>
    </Card>
  );
};
