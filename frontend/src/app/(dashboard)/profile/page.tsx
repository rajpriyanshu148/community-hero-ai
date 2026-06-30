'use client';

import React, { useEffect, useState } from 'react';
import { User, Award, Compass, Shield, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { TrustScoreRing } from '../../../components/shared/TrustScoreRing';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState('PLUMBER');
  const [myIssues, setMyIssues] = useState<any[]>([]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `/api/v1/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setUser(response.data.data.user);
        
        // Fetch user's reported issues
        const issuesRes = await axios.get(
          `/api/v1/issues/my`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (issuesRes.data.success) {
          setMyIssues(issuesRes.data.data.issues || []);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRegisterSkill = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `/api/v1/skills`,
        { skill: selectedSkill },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Volunteer skill registered! Awaiting verification.');
        fetchProfile();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register skill');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner layout */}
      <Card className="glass p-6 border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[30%] h-[150%] bg-gradient-to-r from-emerald-500/10 to-transparent blur-[50px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-lg text-cyan-400">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold tracking-tight text-white font-space leading-none">
              {user?.name}
            </h2>
            <div className="flex flex-col gap-0.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
              </span>
              <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                <MapPin className="w-3.5 h-3.5" />
                <span>{user?.ward || 'Unassigned Ward'}</span>
              </span>
            </div>
            <div className="mt-1">
              <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-bold uppercase">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Level stats */}
        <div className="flex items-center gap-6 relative z-10 flex-shrink-0">
          <div className="flex flex-col items-end text-right">
            <span className="text-sm font-bold text-white font-space">Level {user?.level}</span>
            <span className="text-[10px] text-slate-550 font-bold uppercase">{user?.xp} XP Total</span>
          </div>
          <TrustScoreRing score={user?.trustScore || 50} level={user?.level || 1} size={90} strokeWidth={8} />
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left pane (col span 2) - Reported issues list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-base font-bold text-white font-space">My Reported Issues ({myIssues.length})</h3>
          
          <div className="flex flex-col gap-3">
            {myIssues.length > 0 ? (
              myIssues.map((issue: any) => (
                <Card key={issue.id} className="glass p-4 border-slate-900 flex justify-between items-center gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{issue.category}</span>
                    <h4 className="text-sm font-bold text-white truncate max-w-sm">{issue.title}</h4>
                    <span className="text-[10px] text-slate-500">{new Date(issue.createdAt).toLocaleDateString()} • {issue.address}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400">
                    {issue.status}
                  </span>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 border border-slate-900 border-dashed rounded-2xl text-slate-500 text-xs font-semibold">
                You have not filed any reports yet.
              </div>
            )}
          </div>
        </div>

        {/* Right pane (col span 1) - Volunteer skills checklist */}
        <div className="flex flex-col gap-6">
          {/* Skills checklist */}
          <Card className="glass p-5 border-slate-900 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-bold text-white tracking-wide font-space">Volunteer Skill Matrix</h4>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Volunteer your expertise to help resolve local electrical, carpentry, plumbing, or cleanup complaints.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-2">
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="ELECTRICIAN">Electrician</option>
                  <option value="CARPENTER">Carpenter</option>
                  <option value="PAINTER">Painter</option>
                  <option value="PLUMBER">Plumber</option>
                  <option value="CLEANER">Neighborhood Cleaner</option>
                  <option value="TECHNICIAN">Technician</option>
                </select>
                <Button variant="civic" className="text-xs font-bold py-2 h-auto" onClick={handleRegisterSkill}>
                  Add Skill
                </Button>
              </div>

              {/* Registered skills list */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900/60">
                {user?.skills?.length > 0 ? (
                  user.skills.map((s: any) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-full text-[10px] font-bold text-slate-350 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{s.skill}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-550 italic">No registered skills yet.</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
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
