import { io, Socket } from 'socket.io-client';
import { getToken } from './api';
import type { Issue, LedgerEntry, IssueStatus, Notification, Verification, Badge } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// ========================
// Socket Instance
// ========================
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: (cb) => {
        cb({ token: getToken() });
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection lifecycle logging
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    socket.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts');
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

// ========================
// Room Helpers
// ========================
export const joinRoom = (room: string) => {
  const s = getSocket();
  s.emit('join:room', { room });
};

export const leaveRoom = (room: string) => {
  const s = getSocket();
  s.emit('leave:room', { room });
};

export const joinIssueRoom = (issueId: string) => {
  joinRoom(`issue:${issueId}`);
};

export const leaveIssueRoom = (issueId: string) => {
  leaveRoom(`issue:${issueId}`);
};

export const joinUserRoom = (userId: string) => {
  joinRoom(`user:${userId}`);
};

export const joinWardRoom = (wardNumber: number) => {
  joinRoom(`ward:${wardNumber}`);
};

// ========================
// Event Listeners
// ========================
export const onIssueUpdate = (
  cb: (data: { issueId: string; status: IssueStatus; entry: LedgerEntry }) => void
) => {
  const s = getSocket();
  s.on('issue:update', cb);
  return () => s.off('issue:update', cb);
};

export const onIssueNew = (cb: (data: Issue) => void) => {
  const s = getSocket();
  s.on('issue:new', cb);
  return () => s.off('issue:new', cb);
};

export const onNotification = (cb: (data: Notification) => void) => {
  const s = getSocket();
  s.on('notification:new', cb);
  return () => s.off('notification:new', cb);
};

export const onVerificationNew = (
  cb: (data: { issueId: string; verification: Verification }) => void
) => {
  const s = getSocket();
  s.on('verification:new', cb);
  return () => s.off('verification:new', cb);
};

export const onXpEarned = (
  cb: (data: { amount: number; reason: string; total: number }) => void
) => {
  const s = getSocket();
  s.on('xp:earned', cb);
  return () => s.off('xp:earned', cb);
};

export const onBadgeEarned = (cb: (data: Badge) => void) => {
  const s = getSocket();
  s.on('badge:earned', cb);
  return () => s.off('badge:earned', cb);
};

export const removeAllListeners = (event?: string) => {
  if (socket) {
    if (event) {
      socket.removeAllListeners(event);
    } else {
      socket.removeAllListeners();
    }
  }
};

export default getSocket;
