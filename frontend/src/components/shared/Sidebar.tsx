'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  Plus,
  Map,
  Trophy,
  Target,
  Eye,
  User,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
} from 'lucide-react';
import { cn, levelTitle } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { Avatar } from '@/components/ui/avatar';
import { Role } from '@/types';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [Role.CITIZEN, Role.AUTHORITY, Role.ADMIN],
  },
  {
    label: 'Report Issue',
    href: '/report',
    icon: Plus,
    roles: [Role.CITIZEN, Role.AUTHORITY, Role.ADMIN],
    highlight: true,
  },
  {
    label: 'City Map',
    href: '/map',
    icon: Map,
    roles: [Role.CITIZEN, Role.AUTHORITY, Role.ADMIN],
  },
  {
    label: 'Leaderboard',
    href: '/leaderboard',
    icon: Trophy,
    roles: [Role.CITIZEN, Role.AUTHORITY, Role.ADMIN],
  },
  {
    label: 'Missions',
    href: '/missions',
    icon: Target,
    roles: [Role.CITIZEN, Role.AUTHORITY, Role.ADMIN],
  },
  {
    label: 'AI Watchtower',
    href: '/watchtower',
    icon: Eye,
    roles: [Role.CITIZEN, Role.AUTHORITY, Role.ADMIN],
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
    roles: [Role.CITIZEN, Role.AUTHORITY, Role.ADMIN],
  },
  {
    label: 'Authority Panel',
    href: '/authority',
    icon: Building2,
    roles: [Role.AUTHORITY, Role.ADMIN],
    dividerBefore: true,
  },
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: Settings,
    roles: [Role.ADMIN],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        'flex-shrink-0 h-full flex flex-col glass-dark border-r border-border overflow-hidden relative',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-glow-cyan">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <p className="font-heading font-bold text-white text-sm leading-none whitespace-nowrap">
                Community<span className="text-gradient"> Hero</span>
              </p>
              <p className="text-[9px] text-slate-500 tracking-widest uppercase mt-0.5">
                AI Platform
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <div key={item.href}>
              {item.dividerBefore && (
                <div className="divider-glow my-3 mx-1" />
              )}
              <Link href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                    active
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : item.highlight
                      ? 'bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 text-cyan-300 border border-cyan-500/20 hover:from-cyan-500/20 hover:to-emerald-500/15'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {active && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-emerald-400 rounded-r-full"
                    />
                  )}
                  <Icon
                    className={cn(
                      'flex-shrink-0 transition-colors duration-200',
                      sidebarCollapsed ? 'w-5 h-5' : 'w-4.5 h-4.5',
                      active ? 'text-cyan-400' : item.highlight ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium whitespace-nowrap flex-1"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.highlight && !sidebarCollapsed && (
                    <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  )}
                </motion.div>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div className="border-t border-border p-3">
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer group',
              sidebarCollapsed ? 'justify-center' : ''
            )}
          >
            <Avatar
              src={user.avatar}
              name={user.name}
              size="sm"
              trustScore={user.trustScore}
              showTrustRing
              level={user.level}
              showLevel
            />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{levelTitle(user.level)} • {user.trustScore}TS</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!sidebarCollapsed && (
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebarCollapsed}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full glass border border-border flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/40 transition-all duration-200 shadow-md z-10"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
}
