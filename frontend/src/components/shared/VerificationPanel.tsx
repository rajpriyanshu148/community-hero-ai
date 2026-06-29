'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle, Loader } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useIssues } from '../../hooks/useIssues';
import toast from 'react-hot-toast';

interface VerificationPanelProps {
  issueId: string;
  verifications: any[];
  onVerified?: () => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  issueId,
  verifications = [],
  onVerified,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { verifyIssue } = useIssues();

  // Calculate percentages
  const existsWeight = verifications.filter(v => v.result === 'EXISTS').reduce((sum, v) => sum + v.trustWeight, 0);
  const fakeWeight = verifications.filter(v => v.result === 'FAKE').reduce((sum, v) => sum + v.trustWeight, 0);
  const resolvedWeight = verifications.filter(v => v.result === 'RESOLVED').reduce((sum, v) => sum + v.trustWeight, 0);
  
  const totalWeight = existsWeight + fakeWeight + resolvedWeight || 1;

  const existsPercent = (existsWeight / totalWeight) * 100;
  const fakePercent = (fakeWeight / totalWeight) * 100;
  const resolvedPercent = (resolvedWeight / totalWeight) * 100;

  const handleVerify = async (result: 'EXISTS' | 'FAKE' | 'RESOLVED') => {
    setLoading(result);
    try {
      await verifyIssue.mutateAsync({ issueId, result });
      toast.success(`Verification cast: marked as ${result.toLowerCase()}`);
      if (onVerified) onVerified();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="glass p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Community Verification</h3>
        <p className="text-sm text-slate-400">Nearby citizens, verify if this issue currently exists.</p>
      </div>

      {/* Verification stats */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>STILL EXISTS</span>
            <span>{existsPercent.toFixed(0)}% ({existsWeight.toFixed(1)} weight)</span>
          </div>
          <Progress value={existsPercent} variant="emerald" />
        </div>
        
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>FAKE / SPAM</span>
            <span>{fakePercent.toFixed(0)}% ({fakeWeight.toFixed(1)} weight)</span>
          </div>
          <Progress value={fakePercent} variant="rose" />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>ALREADY RESOLVED</span>
            <span>{resolvedPercent.toFixed(0)}% ({resolvedWeight.toFixed(1)} weight)</span>
          </div>
          <Progress value={resolvedPercent} variant="default" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400 flex items-center justify-center gap-2 py-3 h-auto"
          onClick={() => handleVerify('EXISTS')}
          disabled={loading !== null}
        >
          {loading === 'EXISTS' ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>Exists</span>
        </Button>

        <Button
          variant="outline"
          className="border-rose-500/20 hover:bg-rose-500/10 text-rose-400 flex items-center justify-center gap-2 py-3 h-auto"
          onClick={() => handleVerify('FAKE')}
          disabled={loading !== null}
        >
          {loading === 'FAKE' ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldAlert className="w-4 h-4" />
          )}
          <span>Fake</span>
        </Button>

        <Button
          variant="outline"
          className="border-sky-500/20 hover:bg-sky-500/10 text-sky-400 flex items-center justify-center gap-2 py-3 h-auto"
          onClick={() => handleVerify('RESOLVED')}
          disabled={loading !== null}
        >
          {loading === 'RESOLVED' ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>Resolved</span>
        </Button>
      </div>

      {/* Voters list count */}
      <div className="text-xs text-slate-500 text-center">
        Total {verifications.length} community members have voted on this issue.
      </div>
    </div>
  );
};
