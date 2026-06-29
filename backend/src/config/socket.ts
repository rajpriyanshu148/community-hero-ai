import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { logger } from '../utils/logger';
import type { AuthUser } from '../types';

// ============================================================
// Global Socket.IO Instance
// ============================================================
let io: SocketIOServer;

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initializeSocket first.');
  }
  return io;
};

// ============================================================
// Socket Event Names
// ============================================================
export const SOCKET_EVENTS = {
  // Issue events
  ISSUE_CREATED: 'issue:created',
  ISSUE_UPDATED: 'issue:update',
  ISSUE_STATUS_CHANGED: 'issue:statusChanged',
  ISSUE_UPVOTED: 'issue:upvoted',

  // Verification events
  VERIFICATION_REQUEST: 'verification:request',
  VERIFICATION_SUBMITTED: 'verification:submitted',
  VERIFICATION_THRESHOLD_MET: 'verification:thresholdMet',

  // Notification events
  NOTIFICATION_NEW: 'notification:new',

  // Mission events
  MISSION_ASSIGNED: 'mission:assigned',
  MISSION_COMPLETED: 'mission:completed',

  // User events
  USER_LEVEL_UP: 'user:levelUp',
  USER_BADGE_EARNED: 'user:badgeEarned',
  USER_TRUST_UPDATED: 'user:trustUpdated',

  // System events
  WARD_UPDATE: 'ward:update',
  WEATHER_ALERT: 'weather:alert',
} as const;

// ============================================================
// Socket.IO Server Initialization
// ============================================================
export const initializeSocket = (httpServer: http.Server): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // ============================================================
  // JWT Authentication Middleware for Socket.IO
  // ============================================================
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow unauthenticated connections for public rooms (ward, issue rooms)
      socket.data.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      socket.data.user = decoded;
      next();
    } catch {
      socket.data.user = null;
      next(); // Still allow connection, just without auth
    }
  });

  // ============================================================
  // Connection Handler
  // ============================================================
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthUser | null;

    logger.info(`Socket connected: ${socket.id}`, {
      userId: user?.id,
      email: user?.email,
    });

    // ── Join personal room if authenticated
    if (user?.id) {
      socket.join(`user:${user.id}`);
      logger.info(`User ${user.id} joined personal room`);
    }

    // ── Join issue room (for real-time issue updates)
    socket.on('issue:join', (issueId: string) => {
      if (!issueId || typeof issueId !== 'string') return;
      socket.join(`issue:${issueId}`);
      logger.info(`Socket ${socket.id} joined issue room: ${issueId}`);
    });

    socket.on('issue:leave', (issueId: string) => {
      if (!issueId || typeof issueId !== 'string') return;
      socket.leave(`issue:${issueId}`);
    });

    // ── Join ward room (for ward-level updates)
    socket.on('ward:join', (ward: string) => {
      if (!ward || typeof ward !== 'string') return;
      socket.join(`ward:${ward}`);
      logger.info(`Socket ${socket.id} joined ward room: ${ward}`);
    });

    socket.on('ward:leave', (ward: string) => {
      if (!ward || typeof ward !== 'string') return;
      socket.leave(`ward:${ward}`);
    });

    // ── Disconnect handler
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}`, { reason, userId: user?.id });
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
};

// ============================================================
// Emit Helpers
// ============================================================

/**
 * Emit an event to a specific user's room
 */
export const emitToUser = (userId: string, event: string, data: unknown): void => {
  try {
    getIO().to(`user:${userId}`).emit(event, data);
  } catch (err) {
    logger.error(`Failed to emit ${event} to user ${userId}:`, err);
  }
};

/**
 * Emit an event to everyone watching a specific issue
 */
export const emitToIssueRoom = (issueId: string, event: string, data: unknown): void => {
  try {
    getIO().to(`issue:${issueId}`).emit(event, data);
  } catch (err) {
    logger.error(`Failed to emit ${event} to issue ${issueId}:`, err);
  }
};

/**
 * Emit an event to everyone in a ward
 */
export const emitToWard = (ward: string, event: string, data: unknown): void => {
  try {
    getIO().to(`ward:${ward}`).emit(event, data);
  } catch (err) {
    logger.error(`Failed to emit ${event} to ward ${ward}:`, err);
  }
};

/**
 * Broadcast to all connected clients
 */
export const broadcast = (event: string, data: unknown): void => {
  try {
    getIO().emit(event, data);
  } catch (err) {
    logger.error(`Failed to broadcast ${event}:`, err);
  }
};

export { io };
