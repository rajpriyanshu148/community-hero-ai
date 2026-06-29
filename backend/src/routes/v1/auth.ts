import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import session from 'express-session';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  clearCookieOptions,
} from '../../utils/jwt';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { UserRole } from '@prisma/client';

export const authRouter = Router();

// ============================================================
// Passport Setup
// ============================================================

// Session middleware (required for OAuth flow)
authRouter.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000, // 10 min (OAuth flow only)
    },
  })
);

authRouter.use(passport.initialize());
authRouter.use(passport.session());

// Minimal session serialization (we use JWT; session is only for OAuth redirect)
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ── Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

        if (!user) return done(null, false, { message: 'Invalid email or password.' });
        if (!user.passwordHash) return done(null, false, { message: 'Please use Google sign-in.' });
        if (user.isBanned) return done(null, false, { message: 'Account is banned.' });
        if (!user.isActive) return done(null, false, { message: 'Account is deactivated.' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return done(null, false, { message: 'Invalid email or password.' });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── Google OAuth Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google profile'));

          // Upsert user by googleId or email
          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || email.split('@')[0],
                avatar: profile.photos?.[0]?.value,
                googleId: profile.id,
                role: UserRole.CITIZEN,
              },
            });
            logger.info(`New user registered via Google: ${email}`);
          } else if (!user.googleId) {
            // Link Google account to existing email account
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, avatar: profile.photos?.[0]?.value ?? user.avatar },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

// ============================================================
// Validation Schemas
// ============================================================
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('ward').optional().trim().isLength({ max: 100 }).withMessage('Ward name too long'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ============================================================
// POST /register
// ============================================================
authRouter.post('/register', validate(registerValidation), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, ward } = req.body as {
      email: string;
      password: string;
      name: string;
      ward?: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, 'An account with this email already exists.', 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name.trim(),
        ward: ward?.trim(),
        passwordHash,
        role: UserRole.CITIZEN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        ward: true,
        trustScore: true,
        xp: true,
        level: true,
        createdAt: true,
      },
    });

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    logger.info(`New user registered: ${email}`);

    sendSuccess(
      res,
      { user, accessToken },
      'Registration successful! Welcome to Community Hero AI.',
      201
    );
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /login
// ============================================================
authRouter.post('/login', validate(loginValidation), (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate(
    'local',
    { session: false },
    async (err: Error | null, user: { id: string; email: string; role: UserRole } | false, info: { message: string } | undefined) => {
      if (err) return next(err);

      if (!user) {
        sendError(res, info?.message || 'Invalid credentials.', 401);
        return;
      }

      try {
        // Update last seen (no lastSeen field in schema, so we'll use updatedAt via a no-op update)
        const freshUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            ward: true,
            trustScore: true,
            xp: true,
            level: true,
            avatar: true,
            badges: true,
          },
        });

        const accessToken = generateAccessToken(user.id, user.email, user.role);
        const refreshToken = generateRefreshToken(user.id);

        res.cookie('accessToken', accessToken, accessTokenCookieOptions);
        res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

        logger.info(`User logged in: ${user.email}`);
        sendSuccess(res, { user: freshUser, accessToken }, 'Login successful!');
      } catch (loginErr) {
        next(loginErr);
      }
    }
  )(req, res, next);
});

// ============================================================
// POST /logout
// ============================================================
authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('accessToken', clearCookieOptions);
  res.clearCookie('refreshToken', { ...clearCookieOptions, path: '/api/v1/auth' });
  sendSuccess(res, null, 'Logged out successfully.');
});

// ============================================================
// POST /refresh
// ============================================================
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      sendError(res, 'Refresh token is required.', 401);
      return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      sendError(res, 'Invalid or expired refresh token. Please log in again.', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true, isBanned: false, deletedAt: null },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      sendError(res, 'User not found or account is inactive.', 401);
      return;
    }

    const newAccessToken = generateAccessToken(user.id, user.email, user.role);

    res.cookie('accessToken', newAccessToken, accessTokenCookieOptions);

    sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed successfully.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /me
// ============================================================
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        ward: true,
        trustScore: true,
        xp: true,
        level: true,
        badges: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reportedIssues: { where: { isDeleted: false } },
            verifications: true,
            missions: { where: { status: 'COMPLETED' } },
          },
        },
      },
    });

    if (!user) {
      sendError(res, 'User not found.', 404);
      return;
    }

    sendSuccess(res, user, 'Profile retrieved successfully.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /google - Initiate OAuth
// ============================================================
authRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true,
  })
);

// ============================================================
// GET /google/callback
// ============================================================
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    session: true,
    failureRedirect: `${env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as { id: string; email: string; role: UserRole } | undefined;

      if (!user) {
        res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
        return;
      }

      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      res.cookie('accessToken', accessToken, accessTokenCookieOptions);
      res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

      logger.info(`Google OAuth success: ${user.email}`);
      res.redirect(`${env.FRONTEND_URL}/auth/success?token=${accessToken}`);
    } catch (err) {
      next(err);
    }
  }
);
