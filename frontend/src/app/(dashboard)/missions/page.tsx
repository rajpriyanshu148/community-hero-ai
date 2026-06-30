'use client';

import React, { useEffect, useState } from 'react';
import { Target, Compass, Award, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { MissionCard } from '../../../components/shared/MissionCard';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MissionsPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMissions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `/api/v1/missions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setMissions(response.data.data.available || []);
        setActiveMissions(response.data.data.active || []);
      }
    } catch (err) {
      console.error('Error fetching missions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleMissionAction = async (missionId: string, action: 'ACCEPT' | 'COMPLETE') => {
    setActionLoading(missionId);
    try {
      const token = localStorage.getItem('access_token');
      const url = action === 'ACCEPT' 
        ? `/api/v1/missions/${missionId}/accept`
        : `/api/v1/missions/${missionId}/complete`;

      const response = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });

      if (response.data.success) {
        if (action === 'ACCEPT') {
          toast.success('Mission accepted. Stay safe out there!');
        } else {
          toast.success(`🎉 Mission complete! +${response.data.data.xpEarned} XP awarded!`);
        }
        fetchMissions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process mission action');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-space mb-1">Community Missions</h2>
        <p className="text-xs text-slate-550">Verify reports, survey local neighborhoods, earn rewards</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Missions (Col span 1) */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-white font-space flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Active Assignments</span>
            </h3>

            {activeMissions.length > 0 ? (
              <div className="flex flex-col gap-4">
                {activeMissions.map((item: any) => (
                  <MissionCard
                    key={item.id}
                    mission={item.mission}
                    status="ACCEPTED"
                    onAction={handleMissionAction}
                    loading={actionLoading === item.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-slate-900 border-dashed rounded-2xl text-slate-500 text-xs font-semibold">
                No active assignments. Accept a mission from the available board.
              </div>
            )}
          </div>

          {/* Available Missions Board (Col span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-base font-bold text-white font-space flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Available Missions Board</span>
            </h3>

            {missions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {missions.map((mission: any) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    status="AVAILABLE"
                    onAction={handleMissionAction}
                    loading={actionLoading === mission.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-slate-900 border-dashed rounded-2xl text-slate-500 text-xs font-semibold">
                No missions currently listed in your area. Check back later.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
