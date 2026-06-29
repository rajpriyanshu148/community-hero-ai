import { Router } from 'express';
import { authRouter } from './auth';
import { issuesRouter } from './issues';
import { aiRouter } from './ai';
import { verifyRouter } from './verify';
import { missionsRouter } from './missions';
import { leaderboardRouter } from './leaderboard';
import { dashboardRouter } from './dashboard';
import { authorityRouter } from './authority';
import { adminRouter } from './admin';
import { notificationsRouter } from './notifications';
import { weatherRouter } from './weather';
import { skillsRouter } from './skills';

export const apiV1Router = Router();

// Mount all route modules
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/issues', issuesRouter);
apiV1Router.use('/ai', aiRouter);
apiV1Router.use('/verify', verifyRouter);
apiV1Router.use('/missions', missionsRouter);
apiV1Router.use('/leaderboard', leaderboardRouter);
apiV1Router.use('/dashboard', dashboardRouter);
apiV1Router.use('/authority', authorityRouter);
apiV1Router.use('/admin', adminRouter);
apiV1Router.use('/notifications', notificationsRouter);
apiV1Router.use('/weather', weatherRouter);
apiV1Router.use('/skills', skillsRouter);

// API Info
apiV1Router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Community Hero AI API v1',
    version: '1.0.0',
    endpoints: [
      '/auth',
      '/issues',
      '/ai',
      '/verify',
      '/missions',
      '/leaderboard',
      '/dashboard',
      '/authority',
      '/admin',
      '/notifications',
      '/weather',
      '/skills',
    ],
  });
});
