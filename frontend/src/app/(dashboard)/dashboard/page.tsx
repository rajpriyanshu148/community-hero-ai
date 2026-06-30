'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, Plus, Sparkles, Target, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { TrustScoreRing } from '../../../components/shared/TrustScoreRing';
import { IssueCard } from '../../../components/shared/IssueCard';
import { useIssues } from '../../../hooks/useIssues';
import axios from 'axios';

export default function CitizenDashboard() {
  const [user, setUser] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const { data: issuesData, isLoading: issuesLoading } = useIssues({ limit: 3 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const userRes = await axios.get(
          `/api/v1/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (userRes.data.success) {
          const userData = userRes.data.data.user;
          setUser(userData);

          // Fetch predictions for user's ward
          if (userData.ward) {
            const predRes = await axios.get(
              `/api/v1/ai/predictions?ward=${userData.ward}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (predRes.data.success) {
              setPredictions(predRes.data.data);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <Card className="glass p-6 border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-gradient-to-l from-cyan-500/10 to-transparent blur-[60px]" />
        
        <div className="flex flex-col gap-2 text-center md:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-white font-space">
            Welcome back, {user?.name || 'Citizen'}!
          </h2>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Your contributions help keep {user?.ward || 'your ward'} safe. Check predictions or accept nearby missions to protect your community.
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs font-bold text-cyan-400 justify-center md:justify-start">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Level {user?.level} • {user?.xp} XP total</span>
          </div>
        </div>

        {/* Circular trust score badge */}
        <div className="flex-shrink-0">
          <TrustScoreRing score={user?.trustScore || 50} level={user?.level || 1} />
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Issues Feed (Col Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white font-space">Recent Civic Reports</h3>
            <Link href="/report">
              <Button variant="civic" className="py-2 px-4 text-xs font-bold flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>New Report</span>
              </Button>
            </Link>
          </div>

          {issuesLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : (issuesData as any)?.data?.issues?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {((issuesData as any).data.issues).map((issue: any) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-slate-900 border-dashed rounded-2xl text-slate-500 text-xs font-semibold">
              No issues reported in your ward. Be the first to report!
            </div>
          )}
        </div>

        {/* Sidebar widgets */}
        <div className="flex flex-col gap-6">
          {/* AI watchtower preview */}
          <div className="glass p-5 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white tracking-wide">Watchtower Alerts</h4>
              </div>
              <span className="text-[10px] bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
                Ward {user?.ward?.replace('Ward ', '')}
              </span>
            </div>

            {predictions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {predictions.slice(0, 2).map((pred: any) => (
                  <div key={pred.id} className="flex gap-3 text-xs leading-relaxed">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                    <div>
                      <span className="font-bold text-white block">
                        {pred.issueType.replace('_', ' ')} Warning
                      </span>
                      <span className="text-slate-400 text-[11px] leading-relaxed block">
                        Probability: {Math.round(pred.probability * 100)}%. {pred.reasoning}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-550 italic">
                Watchtower database currently normal. No immediate alert warnings.
              </div>
            )}
          </div>

          {/* Missions Preview */}
          <div className="glass p-5 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
              <Target className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white tracking-wide">Active Missions</h4>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center p-3 bg-slate-950/40 rounded-xl border border-slate-900/60 text-xs">
                <div>
                  <span className="font-bold text-white block">Verify 3 nearby issues</span>
                  <span className="text-[10px] text-slate-500">Reward: 150 XP</span>
                </div>
                <Link href="/missions">
                  <Button variant="outline" size="sm" className="border-slate-800 text-[10px] px-2 py-1 h-auto font-bold">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick inline spinner fallback
function Loader(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
