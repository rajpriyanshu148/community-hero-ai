'use client';

import React from 'react';
import { Shield, Sparkles, CheckCircle, AlertTriangle, User, Calendar } from 'lucide-react';

interface LedgerEntry {
  id: string;
  action: string;
  actorName: string;
  metadata?: any;
  createdAt: string;
}

interface IssueTimelineProps {
  entries: LedgerEntry[];
}

export const IssueTimeline: React.FC<IssueTimelineProps> = ({ entries = [] }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'REPORTED':
        return <User className="w-4 h-4 text-cyan-400" />;
      case 'SLA_BREACH_ESCALATED':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'STATUS_CHANGED':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ');
  };

  return (
    <div className="relative pl-6 flex flex-col gap-6 border-l border-slate-900 mt-2">
      {entries.map((entry, index) => (
        <div key={entry.id || index} className="relative flex flex-col gap-1">
          {/* Timeline Node dot */}
          <div className="absolute left-[-31px] top-0 w-4 h-4 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center relative z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <span className="p-1 bg-slate-900 rounded text-slate-400">
              {getActionIcon(entry.action)}
            </span>
            <span className="uppercase tracking-wide">{getActionLabel(entry.action)}</span>
          </div>

          <div className="text-xs text-slate-400 pl-8 leading-relaxed">
            By <span className="text-slate-305 font-semibold">{entry.actorName}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-500 pl-8 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(entry.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
