/**
 * Student Portal - Notification Controller
 * HTTP request/response handling for notification operations
 * 
 * Handles notification retrieval and read status updates with student-scoped validation.
 * Ensures students can only access and update their own notifications.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { ValidationError } from '../../../shared/errors';
import { markAsReadSchema } from '../schemas/notification.schema';
import { extractStudentId } from '../utils/studentScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  /**
   * GET /api/student/notifications
   * Get all notifications for authenticated student
   * 
   * Extracts student_id from JWT token and returns all notifications
   * ordered by creation date descending.
   * 
   * Requirements: 5.1, 5.2
   */
  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Retrieve notifications
      const notificationsList = await this.notificationService.getNotificationsByStudent(
        studentId
      );

      res.json({
        success: true,
        data: notificationsList,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/student/notifications/:id/read
   * Mark a notification as read
   * 
   * Extracts student_id from JWT token and marks the specified notification as read.
   * Validates that the notification belongs to the authenticated student.
   * 
   * Requirements: 5.3, 5.4, 5.5
   */
  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate notification ID from route parameter
      const paramValidation = markAsReadSchema.safeParse({ id: req.params.id });
      if (!paramValidation.success) {
        throw new ValidationError('Validation failed', paramValidation.error.errors);
      }

      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      const notificationId = paramValidation.data.id;

      // Mark notification as read (includes ownership validation)
      const updatedNotification = await this.notificationService.markNotificationAsRead(
        notificationId,
        studentId
      );

      res.json({
        success: true,
        data: updatedNotification,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/student/notifications/read-all
   * Mark all notifications as read
   * 
   * Extracts student_id from JWT token and marks all unread notifications as read.
   * 
   * Requirements: 5.4, 5.5
   */
  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Mark all notifications as read
      const count = await this.notificationService.markAllNotificationsAsRead(studentId);

      res.json({
        success: true,
        data: {
          marked_as_read: count,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
