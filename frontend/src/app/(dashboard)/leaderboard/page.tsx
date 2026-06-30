'use client';

import React, { useEffect, useState } from 'react';
import { Award, Shield, Flame, Compass, ChevronUp } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import axios from 'axios';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(
          `/api/v1/leaderboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setUsers(response.data.data.users || []);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Award className="w-5 h-5 text-yellow-400" />;
    if (rank === 1) return <Award className="w-5 h-5 text-slate-350" />;
    if (rank === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-500 font-bold font-mono text-xs">{rank + 1}</span>;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-space mb-1">Civic Hero Leaderboard</h2>
        <p className="text-xs text-slate-500">Honoring the citizens driving hyperlocal transformation</p>
      </div>

      {/* Podiums for Top 3 */}
      {!loading && users.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto w-full items-end pt-12 pb-6 px-4">
          {/* Rank 2 (left) */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-350 flex items-center justify-center font-bold text-slate-350 shadow-lg text-sm relative">
              {users[1].name.charAt(0)}
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-350 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                #2
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[80px]">
                {users[1].name}
              </span>
              <span className="text-[10px] text-slate-500 font-bold block">{users[1].xp} XP</span>
            </div>
            <div className="w-full h-20 bg-gradient-to-t from-slate-900/60 to-slate-900/30 border-x border-t border-slate-800 rounded-t-xl" />
          </div>

          {/* Rank 1 (center) */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-yellow-400 flex items-center justify-center font-bold text-yellow-400 shadow-2xl text-base relative">
              {users[0].name.charAt(0)}
              <Flame className="w-4 h-4 text-yellow-400 absolute -top-4 left-1/2 transform -translate-x-1/2 animate-bounce" />
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-white block truncate max-w-[100px]">
                {users[0].name}
              </span>
              <span className="text-xs text-cyan-400 font-bold block">{users[0].xp} XP</span>
            </div>
            <div className="w-full h-28 bg-gradient-to-t from-cyan-950/20 to-slate-900/40 border-x border-t border-cyan-500/20 rounded-t-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
            </div>
          </div>

          {/* Rank 3 (right) */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-amber-600 flex items-center justify-center font-bold text-amber-600 shadow-lg text-xs relative">
              {users[2].name.charAt(0)}
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-600 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                #3
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[80px]">
                {users[2].name}
              </span>
              <span className="text-[10px] text-slate-500 font-bold block">{users[2].xp} XP</span>
            </div>
            <div className="w-full h-16 bg-gradient-to-t from-slate-900/60 to-slate-900/30 border-x border-t border-slate-800 rounded-t-xl" />
          </div>
        </div>
      )}

      {/* Main rankings list */}
      <Card className="glass p-5 border-slate-900">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-b border-slate-900 pb-3 px-4 uppercase tracking-wider">
              <div className="flex gap-8 items-center">
                <span>Rank</span>
                <span>Citizen Name</span>
              </div>
              <div className="flex gap-16 items-center">
                <span>Trust Index</span>
                <span>Experience</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
              {users.map((item: any, index: number) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 rounded-xl bg-slate-900/40 border border-slate-800/40 hover:border-slate-800 transition-all px-4"
                >
                  <div className="flex gap-8 items-center">
                    <div className="w-6 flex items-center justify-center">
                      {getRankIcon(index)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-400">
                        {item.name.charAt(0)}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-white leading-none">{item.name}</span>
                        <span className="text-[10px] text-slate-500 leading-none">Level {item.level}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-16 items-center text-xs">
                    <div className="w-16 text-center font-bold text-emerald-400">
                      {item.trustScore.toFixed(0)}%
                    </div>
                    <div className="w-16 text-right font-bold text-slate-200">
                      {item.xp} XP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Inline fallback loader
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
