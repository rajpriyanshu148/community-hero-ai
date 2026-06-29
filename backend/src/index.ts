import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import http from 'http';
import path from 'path';

import { env } from './config/env';
import { prisma } from './config/database';
import { redisClient } from './config/redis';
import { initializeSocket } from './config/socket';
import { apiV1Router } from './routes/v1';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import cron jobs
import './jobs/sla-escalation.job';
import './jobs/prediction.job';

const app = express();
const httpServer = http.createServer(app);

// ============================================================
// Initialize Socket.IO
// ============================================================
initializeSocket(httpServer);

// ============================================================
// Security Middleware
// ============================================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// ============================================================
// CORS
// ============================================================
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// ============================================================
// Rate Limiting
// ============================================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  skip: (req) => req.path === '/health',
});

app.use('/api', limiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

// ============================================================
// Body Parsing Middleware
// ============================================================
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================================
// Static Files - Serve uploaded media
// ============================================================
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// ============================================================
// Request Logger Middleware
// ============================================================
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    query: req.query,
  });
  next();
});

// ============================================================
// Health Check
// ============================================================
app.get('/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    // db unavailable
  }

  try {
    await redisClient.ping();
    redisStatus = 'connected';
  } catch {
    // redis unavailable
  }

  res.json({
    success: true,
    message: 'Community Hero AI Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

// ============================================================
// API Routes
// ============================================================
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', apiV1Router);

// ============================================================
// 404 Handler
// ============================================================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================
const PORT = env.PORT;

const server = httpServer.listen(PORT, () => {
  logger.info(`🚀 Community Hero AI Backend started`);
  logger.info(`   Port     : ${PORT}`);
  logger.info(`   Env      : ${env.NODE_ENV}`);
  logger.info(`   API      : http://localhost:${PORT}/api/v1`);
  logger.info(`   Health   : http://localhost:${PORT}/health`);
});

// ============================================================
// Graceful Shutdown
// ============================================================
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Database disconnected.');
    } catch (err) {
      logger.error('Error disconnecting from database:', err);
    }

    try {
      redisClient.disconnect();
      logger.info('Redis disconnected.');
    } catch (err) {
      logger.error('Error disconnecting from Redis:', err);
    }

    logger.info('Graceful shutdown complete.');
    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export { app, httpServer };
