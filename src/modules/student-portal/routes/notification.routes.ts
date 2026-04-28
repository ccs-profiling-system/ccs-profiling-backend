/**
 * Student Portal - Notification Routes
 * Route definitions for notification endpoints
 * 
 * Provides endpoints for students to view and manage their notifications.
 * All routes require authentication and RBAC permission checks.
 * 
 */

import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create notification routes
 * 
 * @param notificationController - Notification controller instance
 * @returns Express router with notification routes
 */
export function createNotificationRoutes(
  notificationController: NotificationController
): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/student/notifications
   * Get all notifications for authenticated student
   * 
   * Permission: student.notification.read
   * 
   * Extracts student_id from JWT token and returns all notifications
   * ordered by creation date descending.
   * 
   * Response:
   * - 200: Notifications retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   */
  router.get(
    '/',
    requirePermission('student.notification.read'),
    notificationController.getNotifications
  );

  /**
   * PATCH /api/student/notifications/:id/read
   * Mark a notification as read
   * 
   * Permission: student.notification.update
   * 
   * Extracts student_id from JWT token and marks the specified notification as read.
   * Validates that the notification belongs to the authenticated student.
   * 
   * Route Parameters:
   * - id: Notification UUID
   * 
   * Response:
   * - 200: Notification marked as read successfully
   * - 400: Bad Request (invalid notification ID format)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission, not a student, or notification doesn't belong to student)
   * - 404: Not Found (notification not found)
   * 
   */
  router.patch(
    '/:id/read',
    requirePermission('student.notification.update'),
    notificationController.markAsRead
  );

  /**
   * PATCH /api/student/notifications/read-all
   * Mark all notifications as read
   * 
   * Permission: student.notification.update
   * 
   * Extracts student_id from JWT token and marks all unread notifications as read.
   * 
   * Response:
   * - 200: All notifications marked as read successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   */
  router.patch(
    '/read-all',
    requirePermission('student.notification.update'),
    notificationController.markAllAsRead
  );

  return router;
}
