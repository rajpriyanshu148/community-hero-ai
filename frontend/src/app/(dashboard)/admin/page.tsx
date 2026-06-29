'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ShieldAlert, Users, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [fraudIssues, setFraudIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch users
      const usersRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (usersRes.data.success) {
        setUsers(usersRes.data.data.users || []);
      }

      // Fetch fraud flagged issues
      const fraudRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/fraud`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (fraudRes.data.success) {
        setFraudIssues(fraudRes.data.data.issues || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/users/${userId}/ban`,
        { isBanned },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(isBanned ? 'User account suspended' : 'User account restored');
        fetchAdminData();
      }
    } catch (err) {
      toast.error('Failed to update ban status');
    }
  };

  const handleFraudReview = async (issueId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/fraud/${issueId}/review`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Flagged report reviewed: ${action.toLowerCase()}d`);
        fetchAdminData();
      }
    } catch (err) {
      toast.error('Failed to review fraud status');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-space mb-1">Administrative Center</h2>
        <p className="text-xs text-slate-550">Spam moderation queue, user credentials validation, and system controls</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Users List (Col span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-base font-bold text-white font-space flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Registered Accounts</span>
            </h3>

            <div className="flex flex-col gap-3">
              {users.map((item: any) => (
                <Card key={item.id} className="glass p-4 border-slate-900 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-400">
                      {item.name.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white leading-none">{item.name}</span>
                      <span className="text-[10px] text-slate-500">{item.email} • {item.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-455">Trust: {item.trustScore}%</span>
                    <Button
                      variant={item.isBanned ? 'civic' : 'outline'}
                      className="text-[10px] font-bold px-3 py-1 h-auto"
                      onClick={() => handleBanToggle(item.id, !item.isBanned)}
                    >
                      {item.isBanned ? 'Lift Ban' : 'Suspend'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Fraud moderation queue (Col span 1) */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-white font-space flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Spam / Fraud Queue</span>
            </h3>

            {fraudIssues.length > 0 ? (
              <div className="flex flex-col gap-4">
                {fraudIssues.map((issue: any) => (
                  <Card key={issue.id} className="glass p-4 border-slate-900 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="font-bold text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Flagged Suspect</span>
                      </span>
                      <h4 className="text-xs font-bold text-white block leading-tight">{issue.title}</h4>
                      <span className="text-[10px] text-slate-500 leading-relaxed">{issue.address}</span>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-slate-900/60 pt-3">
                      <Button
                        variant="outline"
                        className="text-[9px] font-bold px-2.5 py-1 h-auto hover:bg-slate-900 border-slate-800"
                        onClick={() => handleFraudReview(issue.id, 'REJECT')}
                      >
                        Delete Report
                      </Button>
                      <Button
                        variant="civic"
                        className="text-[9px] font-bold px-2.5 py-1 h-auto"
                        onClick={() => handleFraudReview(issue.id, 'APPROVE')}
                      >
                        Approve / Validate
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-slate-900 border-dashed rounded-2xl text-slate-500 text-xs font-semibold">
                Fraud review queue currently empty. Watchdog engine secure.
              </div>
            )}
          </div>
        </div>
      )}
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
