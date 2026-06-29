'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CloudRain, ShieldCheck, X } from 'lucide-react';

interface PredictionAlertProps {
  type: 'PREDICTION' | 'WEATHER' | 'SYSTEM';
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  onDismiss?: () => void;
}

export const PredictionAlert: React.FC<PredictionAlertProps> = ({
  type,
  title,
  message,
  severity,
  onDismiss,
}) => {
  const getColors = () => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950/40 border-rose-500/30 text-rose-200';
      case 'HIGH':
        return 'bg-amber-950/40 border-amber-500/30 text-amber-200';
      case 'MEDIUM':
        return 'bg-blue-950/40 border-blue-500/30 text-blue-200';
      default:
        return 'bg-slate-900/60 border-slate-800 text-slate-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'WEATHER':
        return <CloudRain className="w-5 h-5 flex-shrink-0 text-cyan-400" />;
      case 'PREDICTION':
        return <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`glass flex gap-4 p-4 rounded-xl border ${getColors()} relative overflow-hidden`}
    >
      {/* Sparkle border trace */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />

      {getIcon()}

      <div className="flex-1 flex flex-col gap-1 pr-6">
        <h4 className="text-sm font-bold tracking-wide uppercase">{title}</h4>
        <p className="text-xs leading-relaxed opacity-80">{message}</p>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};
