'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, ArrowUp, Clock, Eye } from 'lucide-react';
import { cn, formatDate, categoryIcon, truncateAddress } from '@/lib/utils';
import { SeverityBadge, StatusBadge, Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useUpvoteIssue } from '@/hooks/useIssues';
import type { Issue } from '@/types';

interface IssueCardProps {
  issue: Issue;
  compact?: boolean;
  className?: string;
  showReporter?: boolean;
}

export function IssueCard({ issue, compact = false, className, showReporter = true }: IssueCardProps) {
  const { mutate: upvote, isPending: upvoting } = useUpvoteIssue();

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    upvote(issue.id);
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'glass-card rounded-xl border border-border hover:border-cyan-500/20 transition-all duration-300 overflow-hidden group',
        className
      )}
    >
      <Link href={`/issues/${issue.id}`} className="block">
        {/* Image */}
        {!compact && issue.imageUrls?.[0] && (
          <div className="relative h-40 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={issue.imageUrls[0]}
              alt={issue.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute top-2 right-2">
              <SeverityBadge severity={issue.severity} />
            </div>
            <div className="absolute bottom-2 left-2">
              <Badge variant="default" className="text-white bg-black/50 backdrop-blur-sm border-white/10">
                {categoryIcon(issue.category)} {issue.category.toLowerCase().replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        )}

        <div className={cn('p-4', compact && 'py-3')}>
          {/* Top row badges */}
          {compact && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <SeverityBadge severity={issue.severity} />
              <StatusBadge status={issue.status} />
              <span className="text-slate-500 text-xs ml-auto">
                {categoryIcon(issue.category)}
              </span>
            </div>
          )}

          {!compact && !issue.imageUrls?.[0] && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <SeverityBadge severity={issue.severity} />
              <StatusBadge status={issue.status} />
              <span className="text-slate-500 text-xs ml-auto">
                {categoryIcon(issue.category)} {issue.category.toLowerCase().replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className={cn(
            'font-heading font-semibold text-white group-hover:text-cyan-100 transition-colors line-clamp-2 leading-snug',
            compact ? 'text-sm' : 'text-base'
          )}>
            {issue.title}
          </h3>

          {/* Address */}
          <div className="flex items-center gap-1.5 mt-2 text-slate-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs truncate">{truncateAddress(issue.address)}</span>
          </div>

          {!compact && issue.aiAnalysis && (
            <div className="mt-3 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
              <p className="text-xs text-cyan-400 font-medium mb-1">🤖 AI Analysis</p>
              <p className="text-xs text-slate-400 line-clamp-2">
                {Array.isArray(issue.aiAnalysis.reasoning)
                  ? issue.aiAnalysis.reasoning[0]
                  : issue.aiAnalysis.reasoning || 'No analysis details provided.'}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-3">
              {/* Upvote */}
              <button
                onClick={handleUpvote}
                disabled={upvoting}
                className="flex items-center gap-1 text-slate-500 hover:text-cyan-400 transition-colors group/vote"
              >
                <ArrowUp className="w-3.5 h-3.5 group-hover/vote:scale-110 transition-transform" />
                <span className="text-xs font-medium">{issue.upvoteCount}</span>
              </button>

              {/* Views */}
              <span className="flex items-center gap-1 text-slate-600 text-xs">
                <Eye className="w-3 h-3" />
                {issue.viewCount}
              </span>

              {/* Time */}
              <span className="flex items-center gap-1 text-slate-600 text-xs">
                <Clock className="w-3 h-3" />
                {formatDate(issue.createdAt, 'relative')}
              </span>
            </div>

            {showReporter && issue.reporter && (
              <div className="flex items-center gap-1.5">
                <Avatar
                  src={issue.reporter.avatar}
                  name={issue.reporter.name || 'Citizen'}
                  size="xs"
                  trustScore={issue.reporter.trustScore || 50}
                  showTrustRing
                />
                <span className="text-xs text-slate-500 hidden sm:block">
                  {(issue.reporter.name || 'Citizen').split(' ')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Civic Score */}
          {!compact && (
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden w-24">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{ width: `${issue.civicScore}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">Civic: {issue.civicScore}</span>
              </div>
              {issue.isDuplicate && (
                <Badge variant="medium" size="xs">Duplicate</Badge>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
