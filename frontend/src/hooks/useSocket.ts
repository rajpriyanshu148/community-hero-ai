'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  connectSocket,
  disconnectSocket,
  joinUserRoom,
  onNotification,
  onXpEarned,
  onBadgeEarned,
} from '@/lib/socket';
import { useNotificationsStore } from '@/store/notifications.store';
import { useAuthStore } from '@/store/auth.store';
import type { Notification, Badge } from '@/types';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';

export function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotificationsStore();
  const { updateXP, updateTrustScore } = useAuthStore();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (connectedRef.current) return;

    connectSocket();
    connectedRef.current = true;

    // Join user room for personal notifications
    const socket = getSocket();
    socket.on('connect', () => {
      joinUserRoom(user.id);
    });
    if (socket.connected) {
      joinUserRoom(user.id);
    }

    // Listen for notifications
    const offNotification = onNotification((notification: Notification) => {
      addNotification(notification);
      toast(notification.title, {
        icon: getNotificationIcon(notification.type),
        style: {
          background: '#1E293B',
          color: '#F1F5F9',
          border: '1px solid rgba(6,182,212,0.3)',
          fontFamily: 'Inter, sans-serif',
        },
        duration: 4000,
      });
    });

    // Listen for XP gains
    const offXp = onXpEarned(({ amount, reason }) => {
      updateXP(amount);
      toast(`+${amount} XP — ${reason}`, {
        icon: '⚡',
        style: {
          background: '#1E293B',
          color: '#FBBF24',
          border: '1px solid rgba(245,158,11,0.3)',
        },
        duration: 3000,
      });
    });

    // Listen for badge earns
    const offBadge = onBadgeEarned((badge: Badge) => {
      toast(`🏆 Badge Earned: ${badge.name}!`, {
        style: {
          background: '#1E293B',
          color: '#8B5CF6',
          border: '1px solid rgba(139,92,246,0.3)',
        },
        duration: 5000,
      });
    });

    return () => {
      offNotification();
      offXp();
      offBadge();
      connectedRef.current = false;
    };
  }, [isAuthenticated, user?.id]);

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated && connectedRef.current) {
      disconnectSocket();
      connectedRef.current = false;
    }
  }, [isAuthenticated]);

  return { socket: getSocket() };
}

function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    ISSUE_UPDATE: '🔄',
    VERIFICATION: '✅',
    XP_EARNED: '⚡',
    BADGE_EARNED: '🏆',
    MISSION_COMPLETE: '🎯',
    SYSTEM: '🔔',
    ALERT: '⚠️',
  };
  return icons[type] || '🔔';
}
