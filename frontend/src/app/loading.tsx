'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 z-50">
      <motion.div
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="flex items-center gap-3 text-cyan-400"
      >
        <Shield className="w-12 h-12" />
      </motion.div>
      <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden relative">
        <motion.div
          animate={{ left: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full"
        />
      </div>
      <span className="text-xs text-slate-500 font-bold tracking-wider uppercase animate-pulse">
        Initializing AI Watchtower...
      </span>
    </div>
  );
}
