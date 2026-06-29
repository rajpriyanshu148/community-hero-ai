'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Building2,
  Clock,
  DollarSign,
  AlertTriangle,
  Zap,
  CheckCircle,
  Target,
  Lightbulb,
  Copy,
} from 'lucide-react';
import { cn, categoryIcon } from '@/lib/utils';
import { SeverityBadge, Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AIAnalysis } from '@/types';

interface AIAnalysisPanelProps {
  analysis: AIAnalysis;
  compact?: boolean;
  className?: string;
}

export function AIAnalysisPanel({ analysis, compact = false, className }: AIAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [copiedReason, setCopiedReason] = useState<number | null>(null);

  const copyReason = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedReason(idx);
    setTimeout(() => setCopiedReason(null), 1500);
  };

  const impactColorMap = {
    LOW: { color: '#10B981', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
    MEDIUM: { color: '#06B6D4', bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
    HIGH: { color: '#F59E0B', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
    CRITICAL: { color: '#EF4444', bg: 'bg-red-500/10 border-red-500/20 text-red-400' },
  };

  const impact = impactColorMap[analysis.publicImpact] || impactColorMap.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-cyan-500/20 overflow-hidden', className)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/5 px-4 py-3 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-heading font-semibold text-white">Gemini AI Analysis</p>
              <p className="text-xs text-slate-500">
                {new Date(analysis.analyzedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {compact && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0a1628]/60 backdrop-blur-sm"
          >
            <div className="p-4 space-y-4">
              {/* Main Metrics Row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Issue Type */}
                <div className="p-3 rounded-lg bg-surface/80 border border-border">
                  <p className="text-xs text-slate-500 mb-1">Issue Type</p>
                  <p className="text-sm font-semibold text-white">
                    {categoryIcon(analysis.category)} {analysis.issueType}
                  </p>
                </div>

                {/* Severity */}
                <div className="p-3 rounded-lg bg-surface/80 border border-border">
                  <p className="text-xs text-slate-500 mb-1">AI Severity</p>
                  <SeverityBadge severity={analysis.severity} />
                </div>

                {/* Resolution Days */}
                <div className="p-3 rounded-lg bg-surface/80 border border-border">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Est. Resolution
                  </p>
                  <p className="text-sm font-semibold text-white">{analysis.estimatedResolutionDays}d</p>
                </div>

                {/* Cost Estimate */}
                <div className="p-3 rounded-lg bg-surface/80 border border-border">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Est. Cost
                  </p>
                  <p className="text-sm font-semibold text-white">
                    ₹{analysis.estimatedCost?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Confidence Meter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Target className="w-3 h-3" /> AI Confidence
                  </span>
                  <span className="text-xs font-bold text-white">
                    {Math.round(analysis.confidence * 100)}%
                  </span>
                </div>
                <Progress
                  value={analysis.confidence * 100}
                  variant={
                    analysis.confidence >= 0.8 ? 'emerald' :
                    analysis.confidence >= 0.6 ? 'cyan' : 'amber'
                  }
                  size="sm"
                  animated
                />
              </div>

              {/* Department Routing + Public Impact */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs text-slate-300">{analysis.suggestedDepartment}</span>
                </div>
                <div className={cn('px-3 py-1.5 rounded-lg border text-xs font-medium', impact.bg)}>
                  Impact: {analysis.publicImpact}
                </div>
                {analysis.weatherRisk && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    Weather Risk
                  </div>
                )}
              </div>

              {/* Keywords */}
              {analysis.keywords?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" /> Keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Urgency Factors */}
              {analysis.urgencyFactors?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> Urgency Factors
                  </p>
                  <ul className="space-y-1">
                    {analysis.urgencyFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <span className="text-xs text-slate-400">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Reasoning */}
              {analysis.reasoning?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-purple-400" /> AI Reasoning
                  </p>
                  <div className="space-y-2">
                    {analysis.reasoning.map((reason, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="group flex items-start gap-2 p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/20 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300 flex-1 leading-relaxed">{reason}</p>
                        <button
                          onClick={() => copyReason(reason, i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-purple-400"
                          title="Copy"
                        >
                          {copiedReason === i ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate Warning */}
              {analysis.isDuplicate && analysis.duplicateIssueId && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-400">Possible Duplicate Detected</p>
                    <p className="text-xs text-amber-300/70 mt-0.5">
                      AI found a similar existing issue.{' '}
                      <a href={`/issues/${analysis.duplicateIssueId}`} className="underline hover:text-amber-300">
                        View original
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
