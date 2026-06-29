'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Clock, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AuthorityDashboard() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedIssues = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/authority/assigned`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setIssues(response.data.data.issues || []);
      }
    } catch (err) {
      console.error('Error fetching authority data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedIssues();
  }, []);

  const handleUpdateStatus = async (issueId: string, status: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/issues/${issueId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Status updated to ${status.replace('_', ' ')}`);
        fetchAssignedIssues();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-space mb-1">Ward Authority Dashboard</h2>
        <p className="text-xs text-slate-550">Remediation action list and SLA deadline monitoring</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-white font-space">Active Departmental Queue</h3>

          {issues.length > 0 ? (
            <div className="flex flex-col gap-4">
              {issues.map((issue: any) => {
                const deadline = issue.slaDeadline ? new Date(issue.slaDeadline) : null;
                const isOverdue = deadline ? deadline.getTime() < Date.now() : false;

                return (
                  <Card key={issue.id} className="glass p-5 border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[9px] py-0.5 font-bold">{issue.severity}</Badge>
                        <Badge variant="default" className="text-[9px] py-0.5 font-bold">{issue.status}</Badge>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-tight truncate max-w-md">{issue.title}</h4>
                      <span className="text-xs text-slate-405 leading-relaxed">{issue.address}</span>
                      
                      {deadline && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className={isOverdue ? 'text-rose-500' : 'text-slate-400'}>
                            SLA: {deadline.toLocaleString()} {isOverdue && '(BREACHED)'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick status transitions actions */}
                    <div className="flex gap-2 self-stretch md:self-auto justify-end">
                      {issue.status === 'ASSIGNED' && (
                        <Button
                          variant="civic"
                          className="text-xs font-bold px-4 py-2 h-auto flex items-center gap-1.5"
                          onClick={() => handleUpdateStatus(issue.id, 'IN_PROGRESS')}
                        >
                          <span>Start Progress</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {issue.status === 'IN_PROGRESS' && (
                        <Button
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 h-auto flex items-center gap-1.5"
                          onClick={() => handleUpdateStatus(issue.id, 'RESOLVED')}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </Button>
                      )}

                      {issue.status === 'RESOLVED' && (
                        <span className="text-xs font-bold text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg bg-emerald-950/15">
                          ✓ Resolved
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-slate-900 border-dashed rounded-2xl text-slate-500 text-xs font-semibold">
              No tasks currently assigned to your department queue.
            </div>
          )}
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
