'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, MapPin, Award, CheckCircle, Zap, ShieldAlert, BarChart3, Lock } from 'lucide-react';
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
      <section id="hero" className="flex-1 max-w-7xl mx-auto w-full px-6 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
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

      {/* Future Impact Forecasting Stats Bar */}
      <section id="impact" className="border-y border-slate-900 bg-slate-950/45 backdrop-blur relative z-10">
        <div className="max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-extrabold text-white font-space">
              <StatsCounter value={94} suffix=".2%" />
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">AI Forecast Accuracy</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-extrabold text-cyan-400 font-space">
              <StatsCounter value={40} suffix="%" />
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Projected Cost Saved</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-extrabold text-emerald-400 font-space">
              <StatsCounter value={85} suffix="%" />
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">SLA Breach Reduction</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-extrabold text-white font-space">
              <StatsCounter value={100} suffix="%" />
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ledger Auditability</span>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto w-full px-6 py-24 relative z-10 border-t border-slate-900/60 flex flex-col gap-16">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-white font-space">
            How The{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Platform Operates
            </span>
          </h2>
          <p className="text-slate-450 text-sm">
            A seamless four-step flow transforming reports into proactive local resolutions.
          </p>
        </div>

        {/* 4-Step Timeline Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-[28px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-cyan-500/20 z-0" />

          {[
            {
              step: '01',
              title: 'Multimodal Report',
              desc: 'Upload photos, videos, or record voice descriptions. AI parses context and maps coordinates.',
              icon: <Sparkles className="w-5 h-5 text-cyan-450" />,
              color: 'cyan'
            },
            {
              step: '02',
              title: 'Trust Verification',
              desc: 'Citizens verify local reports using trust-weighted consensus, eliminating fraud and fake issues.',
              icon: <Shield className="w-5 h-5 text-emerald-450" />,
              color: 'emerald'
            },
            {
              step: '03',
              title: 'Remediation Routing',
              desc: 'Platform establishes civic scores, calculates SLA deadlines, and alerts authority departments.',
              icon: <Zap className="w-5 h-5 text-amber-450" />,
              color: 'amber'
            },
            {
              step: '04',
              title: 'Mitigation Forecast',
              desc: 'Watchtower scans weather forecasts and historical logs to predict and prevent future hazards.',
              icon: <Award className="w-5 h-5 text-purple-405" />,
              color: 'purple'
            }
          ].map((item, index) => (
            <div key={index} className="flex flex-col gap-4 relative z-10 group text-center lg:text-left items-center lg:items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center relative transition-colors duration-300">
                  {item.icon}
                  <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 pointer-events-none" />
                </div>
                <span className="text-3xl font-extrabold text-slate-800 group-hover:text-cyan-500/20 transition-colors font-space leading-none">
                  {item.step}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-bold text-white font-space tracking-wide uppercase group-hover:text-cyan-450 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-450 text-[11px] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 py-24 relative z-10 flex flex-col gap-12 border-t border-slate-900/60">
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
            <p className="text-slate-450 text-xs leading-relaxed">
              Upload images, video, or voice logs. AI automatically classifies issue, sets severity, estimates costs, and routes it to departments.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 rounded-xl w-fit">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Community Verification</h3>
            <p className="text-slate-455 text-xs leading-relaxed">
              Verify local complaints through a reputation and trust-weighted voting engine. Prevent fraud and guarantee validity.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-amber-950/40 text-amber-450 border border-amber-500/20 rounded-xl w-fit">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">AI Watchtower</h3>
            <p className="text-slate-450 text-xs leading-relaxed">
              Analyzes weather warnings and historical trends to forecast garbage overflows or flooding risks before they happen.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-slate-900 text-cyan-300 border border-slate-800 rounded-xl w-fit">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Digital Twin Map</h3>
            <p className="text-slate-450 text-xs leading-relaxed">
              Interactive Google Maps integration showing real-time ward health scores, hotspots, and active remediation zones.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-cyan-950/20 text-cyan-400 border border-cyan-500/10 rounded-xl w-fit">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Gamified Engagement</h3>
            <p className="text-slate-450 text-xs leading-relaxed">
              Earn XP, badges, and levels. Accept AI-curated missions to verify issues nearby. Climb global and ward leaderboards.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="p-3 bg-emerald-950/20 text-emerald-400 border border-emerald-500/10 rounded-xl w-fit">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Transparency Ledger</h3>
            <p className="text-slate-450 text-xs leading-relaxed">
              All status changes and assignments are cryptographically sealed in an immutable public activity timeline. No silent closures.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-7xl mx-auto w-full px-6 py-24 relative z-10 border-t border-slate-900/60 flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-white font-space">
            About{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Community Hero AI
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Pioneering a collaborative, self-healing framework for modern municipal utilities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Narrative card */}
          <div className="glass p-8 rounded-3xl border border-slate-900 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-cyan-500/5 blur-[50px] pointer-events-none" />
            <p className="text-slate-300 text-sm leading-relaxed">
              Community Hero AI is a next-generation civic intelligence platform designed to transform the way communities identify, report, and resolve local issues. From potholes and water leakages to waste management and damaged infrastructure, the platform empowers citizens to actively participate in building smarter, safer, and more sustainable neighborhoods.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Unlike traditional complaint systems, Community Hero AI goes beyond simple issue reporting. Leveraging the power of Artificial Intelligence, predictive analytics, and community collaboration, the platform not only detects and categorizes civic problems but also predicts potential issues, prioritizes them based on real-world impact, and accelerates their resolution through transparent governance.
            </p>
            <p className="text-slate-450 text-[11px] leading-relaxed italic">
              The platform combines multimodal AI, real-time tracking, digital twins, community verification, and intelligent automation to create a self-healing civic ecosystem where citizens, volunteers, and authorities work together seamlessly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-900/60 mt-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white font-space flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Our Mission
                </span>
                <p className="text-slate-400 text-[11px] leading-normal">
                  To create transparent, inclusive, and proactive communities by enabling citizens and authorities to collaboratively solve hyperlocal challenges using AI-driven insights and collective action.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white font-space flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Our Vision
                </span>
                <p className="text-slate-400 text-[11px] leading-normal">
                  To build self-healing cities where technology, community participation, and intelligent automation work together to improve quality of life and make urban governance more efficient, accountable, and sustainable.
                </p>
              </div>
            </div>
          </div>

          {/* Core pillars grid */}
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white font-space px-2">What Makes Us Different?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'AI-Powered Analysis', desc: 'Automatic categorization and severity assessment using multimodal models.', icon: <Sparkles className="w-3.5 h-3.5" /> },
                { title: 'Predictive Intelligence', desc: 'Anticipate public utility breaches before they expand or cause damage.', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                { title: 'Consensus Verification', desc: 'Ensures absolute trust and removes fraud through reputation weighting.', icon: <Shield className="w-3.5 h-3.5" /> },
                { title: 'Digital Twin Hotmaps', desc: 'Geolocalized ward heatmaps displaying real-time city infrastructure health.', icon: <MapPin className="w-3.5 h-3.5" /> },
                { title: 'Gamified Engagement', desc: 'Incentivize local citizen inspection tasks with experience and badge ranks.', icon: <Award className="w-3.5 h-3.5" /> },
                { title: 'Transparent Timelines', desc: 'Immutable public activity logs for each issue, preventing quiet closures.', icon: <Lock className="w-3.5 h-3.5" /> }
              ].map((item, idx) => (
                <div key={idx} className="glass p-5 rounded-2xl border border-slate-900 flex flex-col gap-2 hover:border-cyan-500/20 transition-all duration-200 group">
                  <span className="text-cyan-400 flex items-center gap-2 text-xs font-bold font-space uppercase tracking-wider">
                    {item.icon}
                    <span>{item.title}</span>
                  </span>
                  <p className="text-slate-450 text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed px-2 mt-2">
              Community Hero AI is not just a platform for reporting problems—it&apos;s a movement towards creating smarter, more resilient, and community-driven cities.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-12 text-center text-slate-500 text-xs mt-auto relative z-10">
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
