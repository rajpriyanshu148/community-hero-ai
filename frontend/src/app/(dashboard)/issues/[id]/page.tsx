'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ThumbsUp, MapPin, Calendar, Clock, User, Shield } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { AIAnalysisPanel } from '../../../../components/shared/AIAnalysisPanel';
import { CivicScoreGauge } from '../../../../components/shared/CivicScoreGauge';
import { IssueTimeline } from '../../../../components/shared/IssueTimeline';
import { VerificationPanel } from '../../../../components/shared/VerificationPanel';
import { useIssues, useUpvoteIssue } from '../../../../hooks/useIssues';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.id as string;
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  const upvoteIssue = useUpvoteIssue();

  const fetchIssueDetail = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `/api/v1/issues/${issueId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setIssue(response.data.data.issue);
        setComments(response.data.data.issue.comments || []);
      }
    } catch (err) {
      console.error('Error fetching issue detail:', err);
      toast.error('Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) fetchIssueDetail();
  }, [issueId]);

  const handleUpvote = async () => {
    try {
      await upvoteIssue.mutateAsync(issueId);
      toast.success('Upvote cast');
      fetchIssueDetail(); // Refresh data
    } catch (err: any) {
      toast.error('Failed to register upvote');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `/api/v1/issues/${issueId}/comment`,
        { content: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Comment added');
        setCommentText('');
        fetchIssueDetail();
      }
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-24 text-slate-500 font-bold">
        Issue details not found or deleted by administration.
      </div>
    );
  }

  const mediaUrls = Array.isArray(issue.mediaUrls) 
    ? issue.mediaUrls 
    : JSON.parse(issue.mediaUrls || '[]');

  const aiAnalysisObj = typeof issue.aiAnalysis === 'string'
    ? JSON.parse(issue.aiAnalysis)
    : issue.aiAnalysis;

  return (
    <div className="flex flex-col gap-6">
      {/* Header toolbar */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-slate-800 p-2 hover:bg-slate-900"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="bg-cyan-950/45 text-cyan-400 border-cyan-500/20 text-[10px] py-0.5 font-bold">
                {issue.category}
              </Badge>
              <Badge variant="default" className="text-[10px] py-0.5 font-bold">
                {issue.status}
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-space leading-tight">
              {issue.title}
            </h2>
          </div>
        </div>

        <Button
          variant="outline"
          className="border-slate-800 hover:bg-slate-900 flex items-center gap-2 font-bold py-2.5 text-xs text-slate-200"
          onClick={handleUpvote}
        >
          <ThumbsUp className="w-4 h-4 text-cyan-400" />
          <span>Upvote ({issue.upvotes})</span>
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column (col span 2) - Media, AI details, map */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Photo gallery */}
          {mediaUrls.length > 0 ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-900 relative">
              <img
                src={mediaUrls[0]}
                alt="Issue media"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl border border-slate-900 border-dashed flex items-center justify-center text-slate-650 text-xs font-semibold">
              No photos or media uploaded for this report.
            </div>
          )}

          {/* AI explainability panel */}
          {aiAnalysisObj && (
            <AIAnalysisPanel analysis={aiAnalysisObj} />
          )}

          {/* Location details card */}
          <Card className="glass p-5 border-slate-900 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-bold text-white tracking-wide">Geospatial Placement</h4>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 font-bold">ADDRESS</span>
              <span className="text-sm text-slate-200 leading-relaxed">{issue.address || 'Reverse geocoding unavailable'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-bold">LATITUDE</span>
                <span className="text-sm font-mono text-slate-350">{issue.lat.toFixed(6)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-bold">LONGITUDE</span>
                <span className="text-sm font-mono text-slate-350">{issue.lng.toFixed(6)}</span>
              </div>
            </div>
          </Card>

          {/* Comments section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-white font-space">Comments & Public Discussion</h3>

            {/* Comment form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500/50"
                placeholder="Post comment to help authority..."
              />
              <Button type="submit" variant="civic" className="px-4 py-2 text-xs font-bold">
                Comment
              </Button>
            </form>

            {/* Comments list */}
            <div className="flex flex-col gap-3">
              {comments.length > 0 ? (
                comments.map((comment: any) => (
                  <div key={comment.id} className="p-4 bg-slate-900/60 border border-slate-900 rounded-xl flex gap-3 text-xs leading-relaxed">
                    <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-slate-400">
                      {comment.user?.name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{comment.user?.name}</span>
                        <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-350">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-600 font-semibold italic">
                  No comments posted on this report.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column - scoring, verification, timeline */}
        <div className="flex flex-col gap-6">
          {/* Civic Emergency score */}
          <Card className="glass p-5 border-slate-900 flex flex-col gap-4 items-center">
            <h4 className="text-xs text-slate-550 font-bold uppercase tracking-wider self-start">Civic Priority Gauge</h4>
            <CivicScoreGauge score={issue.civicScore || 30} />
          </Card>

          {/* Verification Panel */}
          <VerificationPanel
            issueId={issue.id}
            verifications={issue.verifications || []}
            onVerified={fetchIssueDetail}
          />

          {/* Timeline ledger */}
          <Card className="glass p-5 border-slate-900 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-bold text-white tracking-wide">Transparency Timeline</h4>
            </div>
            <IssueTimeline entries={issue.ledger || []} />
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
