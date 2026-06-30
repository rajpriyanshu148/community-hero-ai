'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, MapPin, Award, Users, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { StatsCounter } from '../components/shared/StatsCounter';
import { Navbar } from '../components/shared/Navbar';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section id="how-it-works" className="flex-1 max-w-7xl mx-auto w-full px-6 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 w-fit"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI-Powered Hyperlocal Civic Action</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-space"
          >
            Self-Healing City{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Intelligence
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-lg"
          >
            Empower your community with generative AI analysis, trust-weighted voting, realtime status tracking, and predictive prevention alerts.
          </motion.p>

          <motion.div variants={itemVariants} className="flex gap-4 pt-2">
            <Link href="/report">
              <Button variant="civic" className="py-4 px-6 text-sm font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Report Issue</span>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-slate-800 hover:bg-slate-900 py-4 px-6 text-sm font-bold">
                View Dashboard
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Animated City SVG representation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative aspect-square max-w-md mx-auto w-full flex items-center justify-center lg:max-w-none"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-emerald-500/5 rounded-full blur-[80px]" />
          <svg viewBox="0 0 500 500" className="w-full h-full max-w-[420px] text-cyan-500/20 relative z-10">
            {/* Grid network background */}
            <circle cx="250" cy="250" r="220" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
            <circle cx="250" cy="250" r="150" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="250" cy="250" r="80" fill="none" stroke="currentColor" strokeWidth="1" />

            <line x1="250" y1="30" x2="250" y2="470" stroke="currentColor" strokeWidth="1" />
            <line x1="30" y1="250" x2="470" y2="250" stroke="currentColor" strokeWidth="1" />

            {/* City Nodes */}
            <motion.circle
              cx="120"
              cy="180"
              r="8"
              fill="#06b6d4"
              className="text-cyan-500"
              animate={{ r: [6, 12, 6], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            />
            <motion.circle
              cx="380"
              cy="150"
              r="6"
              fill="#10b981"
              className="text-emerald-500"
              animate={{ r: [5, 10, 5], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
            />
            <motion.circle
              cx="250"
              cy="340"
              r="10"
              fill="#f59e0b"
              className="text-amber-500"
              animate={{ r: [8, 14, 8], opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
            />

            {/* Pulsing connections */}
            <path d="M120 180 Q250 250 380 150" fill="none" stroke="#06b6d4" strokeWidth="2" strokeOpacity="0.4" />
            <path d="M120 180 Q250 250 250 340" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" />
            <path d="M380 150 Q250 250 250 340" fill="none" stroke="#10b981" strokeWidth="2" strokeOpacity="0.4" />

            <circle cx="250" cy="250" r="16" className="fill-slate-950 stroke-cyan-500" strokeWidth="3" />
            <path d="M250 242 L258 250 L250 258 L242 250 Z" fill="#06b6d4" />
          </svg>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section id="impact" className="border-y border-slate-900 bg-slate-950/45 backdrop-blur relative z-10">
        <div className="max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-extrabold text-white font-space">
              <StatsCounter value={50000} suffix="+" />
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Issues Resolved</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-extrabold text-cyan-400 font-space">
              <StatsCounter value={12000} suffix="+" />
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Citizens Engaged</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-extrabold text-emerald-400 font-space">
              <StatsCounter value={98} suffix="%" />
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Satisfaction Rate</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-extrabold text-white font-space">
              <StatsCounter value={4} suffix="h" />
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg Response Time</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 py-24 relative z-10 flex flex-col gap-12">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-white font-space">Civic Tech Platform Features</h2>
          <p className="text-slate-450 text-sm">Everything your city needs to collaborate, predict, track, and resolve civic hazards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 rounded-xl w-fit">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Gemini AI Analysis</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Upload images, video, or voice logs. AI automatically classifies issue, sets severity, estimates costs, and routes it to departments.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 rounded-xl w-fit">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Community Verification</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Verify local complaints through a reputation and trust-weighted voting engine. Prevent fraud and guarantee validity.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-amber-950/40 text-amber-400 border border-amber-500/20 rounded-xl w-fit">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">AI Watchtower</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Analyzes weather warnings and historical trends to forecast garbage overflows or flooding risks before they happen.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-slate-900 text-cyan-300 border border-slate-800 rounded-xl w-fit">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Digital Twin Map</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Interactive Google Maps integration showing real-time ward health scores, hotspots, and active remediation zones.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-cyan-950/20 text-cyan-400 border border-cyan-500/10 rounded-xl w-fit">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Gamified Engagement</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Earn XP, badges, and levels. Accept AI-curated missions to verify issues nearby. Climb global and ward leaderboards.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-emerald-950/20 text-emerald-400 border border-emerald-500/10 rounded-xl w-fit">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Transparency Ledger</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              All status changes and assignments are cryptographically sealed in an immutable public activity timeline. No silent closures.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t border-slate-900 bg-slate-950/80 py-12 text-center text-slate-500 text-xs mt-auto relative z-10">
        <div className="max-w-7xl mx-auto w-full px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold font-space">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>Community Hero AI</span>
          </div>
          <div>© 2026 Community Hero AI. MIT Licensed. Built for a self-healing city.</div>
        </div>
      </footer>
    </div>
  );
}

// Inline fallback since AlertTriangle might not import correctly from lucide-react in some environments
function AlertTriangle(props: any) {
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
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
