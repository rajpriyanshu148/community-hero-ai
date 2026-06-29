import { prisma } from '../config/database';
import { emitToUser, emitToWard, SOCKET_EVENTS } from '../config/socket';
import { logger } from '../utils/logger';

export class NotificationService {
  /**
   * Create a notification in database and emit via socket.
   */
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    payload: any = {}
  ): Promise<any> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          payload,
        },
      });

      // Emit real-time socket event to the user's personal room
      emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);

      return notification;
    } catch (error) {
      logger.error(`Failed to create notification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Notify a status change on an issue.
   */
  static async notifyStatusChange(issue: any, newStatus: string): Promise<void> {
    try {
      // 1. Notify reporter
      await this.createNotification(
        issue.reportedById,
        'ISSUE_STATUS_UPDATE',
        '🔄 Issue Status Updated',
        `Your reported issue "${issue.title}" is now marked as ${newStatus.replace('_', ' ')}.`,
        { issueId: issue.id, status: newStatus }
      );

      // 2. Notify assigned user if one exists
      if (issue.assignedToId) {
        await this.createNotification(
          issue.assignedToId,
          'ASSIGNED_ISSUE_UPDATE',
          '📋 Task Updated',
          `Your assigned task "${issue.title}" has transitioned to status: ${newStatus.replace('_', ' ')}.`,
          { issueId: issue.id, status: newStatus }
        );
      }
    } catch (error) {
      logger.error(`Error notifying status change for issue ${issue.id}:`, error);
    }
  }

  /**
   * Broadcast verification requests to nearby citizens.
   */
  static async sendVerificationRequest(userIds: string[], issue: any): Promise<void> {
    try {
      for (const userId of userIds) {
        await this.createNotification(
          userId,
          'VERIFICATION_REQUEST',
          '🔍 Verify Nearby Issue',
          `Help verify: A new report "${issue.title}" was submitted near you. Is it real?`,
          { issueId: issue.id, lat: issue.lat, lng: issue.lng }
        );
      }
    } catch (error) {
      logger.error(`Error sending verification requests for issue ${issue.id}:`, error);
    }
  }

  /**
   * Broadcast climate weather warnings to a specific ward.
   */
  static async broadcastWeatherAlert(ward: string, alert: any): Promise<void> {
    try {
      emitToWard(ward, SOCKET_EVENTS.WEATHER_ALERT, alert);
      logger.info(`Broadcasted weather alert to ward: ${ward}`);
    } catch (error) {
      logger.error(`Error broadcasting weather alert to ward ${ward}:`, error);
    }
  }
}
