'use client';

import React from 'react';
import { Target, Award, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: 'VERIFY' | 'INSPECT' | 'REPORT';
  ward: string;
}

interface MissionCardProps {
  mission: Mission;
  status?: 'AVAILABLE' | 'ACCEPTED' | 'COMPLETED';
  onAction?: (missionId: string, action: 'ACCEPT' | 'COMPLETE') => void;
  loading?: boolean;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  status = 'AVAILABLE',
  onAction,
  loading = false,
}) => {
  return (
    <Card className="glass p-5 border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col gap-4 relative overflow-hidden group">
      {/* Decorative gradient background glow on hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/0 to-emerald-500/0 group-hover:from-cyan-500/5 group-hover:to-emerald-500/5 transition-all duration-500 rounded-xl" />

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-900 rounded-lg text-cyan-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              {mission.type} • {mission.ward}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/40 border border-cyan-500/20 rounded-full text-xs font-bold text-cyan-400">
          <Award className="w-3.5 h-3.5" />
          <span>+{mission.xpReward} XP</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5">
        <h4 className="text-sm font-bold text-white tracking-wide">{mission.title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{mission.description}</p>
      </div>

      <div className="pt-2">
        {status === 'AVAILABLE' && (
          <Button
            variant="civic"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold"
            onClick={() => onAction && onAction(mission.id, 'ACCEPT')}
            disabled={loading}
          >
            <span>Accept Mission</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}

        {status === 'ACCEPTED' && (
          <Button
            variant="default"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 py-2 text-xs font-bold"
            onClick={() => onAction && onAction(mission.id, 'COMPLETE')}
            disabled={loading}
          >
            <span>Complete Mission</span>
          </Button>
        )}

        {status === 'COMPLETED' && (
          <div className="w-full text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-lg">
            ✓ Mission Completed
          </div>
        )}
      </div>
    </Card>
  );
};
