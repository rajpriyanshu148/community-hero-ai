'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X, AlertCircle, Zap, Shield, Target } from 'lucide-react';
import { useNotificationsStore } from '@/store/notifications.store';
import { usersApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

const notificationIcons: Record<string, React.ReactNode> = {
  ISSUE_UPDATE: <Shield className="w-4 h-4 text-cyan-400" />,
  VERIFICATION: <Check className="w-4 h-4 text-emerald-400" />,
  XP_EARNED: <Zap className="w-4 h-4 text-amber-400" />,
  BADGE_EARNED: <AlertCircle className="w-4 h-4 text-purple-400" />,
  MISSION_COMPLETE: <Target className="w-4 h-4 text-cyan-400" />,
  SYSTEM: <Bell className="w-4 h-4 text-slate-400" />,
  ALERT: <AlertCircle className="w-4 h-4 text-red-400" />,
};

const notificationColors: Record<string, string> = {
  ISSUE_UPDATE: 'border-cyan-500/20 bg-cyan-500/5',
  VERIFICATION: 'border-emerald-500/20 bg-emerald-500/5',
  XP_EARNED: 'border-amber-500/20 bg-amber-500/5',
  BADGE_EARNED: 'border-purple-500/20 bg-purple-500/5',
  MISSION_COMPLETE: 'border-cyan-500/20 bg-cyan-500/5',
  SYSTEM: 'border-slate-500/20 bg-slate-500/5',
  ALERT: 'border-red-500/20 bg-red-500/5',
};

export function NotificationBell() {
  const { notifications, unreadCount, isOpen, setOpen, markRead, markAllRead, setNotifications } =
    useNotificationsStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Load notifications on mount
  useEffect(() => {
    usersApi
      .getNotifications()
      .then((res: any) => {
        if (res?.data) setNotifications(res.data);
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = async (notification: Notification) => {
    if (!notification.isRead) {
      markRead(notification.id);
      usersApi.markNotificationRead(notification.id).catch(() => {});
    }
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    usersApi.markAllNotificationsRead().catch(() => {});
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-200',
          isOpen
            ? 'bg-cyan-500/15 text-cyan-400'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        )}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-glow-red"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-96 glass-dark border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <h3 className="font-heading font-semibold text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors px-2 py-1 rounded-md hover:bg-cyan-500/10"
                  >
                    <CheckCheck className="w-3 h-3" />
                    All read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No notifications yet</p>
                  <p className="text-slate-600 text-xs mt-1">
                    We&apos;ll notify you about issue updates and achievements
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification, i) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleMarkRead(notification)}
                      className={cn(
                        'flex gap-3 px-4 py-3 cursor-pointer transition-all duration-200',
                        'hover:bg-white/5',
                        !notification.isRead && 'bg-cyan-500/3'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border',
                          notificationColors[notification.type] || 'border-slate-700 bg-slate-800'
                        )}
                      >
                        {notificationIcons[notification.type] || (
                          <Bell className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm leading-snug',
                            notification.isRead ? 'text-slate-400' : 'text-white font-medium'
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {formatDate(notification.createdAt, 'relative')}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0 mt-1.5">
                          <div className="w-2 h-2 rounded-full bg-cyan-500" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border px-4 py-2">
                <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors w-full text-center py-1">
                  View all notifications →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
