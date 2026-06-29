import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { getPaginationParams } from '../../types';

export const notificationsRouter = Router();

// All notification routes require authentication
notificationsRouter.use(authenticate);

// ============================================================
// GET /notifications - Get user's notifications (paginated)
// ============================================================
notificationsRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20', unreadOnly } = req.query as {
      page?: string;
      limit?: string;
      unreadOnly?: string;
    };

    const { skip, limit: take, page: currentPage } = getPaginationParams(page, limit);

    const where = {
      userId: req.user!.id,
      ...(unreadOnly === 'true' && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    const totalPages = Math.ceil(total / take);

    sendSuccess(
      res,
      { notifications, unreadCount },
      'Notifications retrieved.',
      200,
      {
        page: currentPage,
        limit: take,
        total,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      }
    );
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /notifications/:id/read - Mark single notification as read
// ============================================================
notificationsRouter.patch('/:id/read', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!notification) {
      sendNotFound(res, 'Notification');
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    sendSuccess(res, updated, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /notifications/read-all - Mark all as read
// ============================================================
notificationsRouter.patch('/read-all', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { count } = await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    sendSuccess(res, { markedRead: count }, `Marked ${count} notifications as read.`);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// DELETE /notifications/:id - Delete a notification
// ============================================================
notificationsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!notification) {
      sendNotFound(res, 'Notification');
      return;
    }

    await prisma.notification.delete({ where: { id: req.params.id } });

    sendSuccess(res, null, 'Notification deleted.');
  } catch (err) {
    next(err);
  }
});
