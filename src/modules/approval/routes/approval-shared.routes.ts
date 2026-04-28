/**
 * Shared Approval Routes
 * 
 * Defines routes accessible to all authenticated users:
 * - Notification management (list, mark as read)
 * - Approval system configuration
 * 
 * All routes require authentication but no specific role permissions.
 * 
 * Requirements: 13.1-13.7, 14.1-14.6
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../../../shared/middleware/validator';
import { approvalAuditMiddleware } from '../../../middleware/approval-audit.middleware';
import { readOperationRateLimiter } from '../middleware/approval-rate-limit.middleware';
import { z } from 'zod';
import { notificationRepository } from '../repositories/notification.repository';
import {
  EntityType,
  Category,
  ApprovalStatus,
} from '../../../db/schema/approvals';
import {
  NotificationType,
  NotificationPriority,
} from '../../../db/schema/approvalNotifications';

/**
 * Validation Schemas
 */

// Notification list query schema
const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  read_status: z.enum(['true', 'false', 'all']).optional(),
});

// Notification ID parameter schema
const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});

// Mark as read schema (empty body)
const markAsReadSchema = z.object({});

/**
 * Helper function to calculate pagination metadata
 */
function calculatePaginationMeta(
  total: number,
  page: number,
  pageSize: number
): {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Create shared approval router
 * 
 * Endpoints:
 * - GET /api/v1/notifications - List user notifications
 * - PATCH /api/v1/notifications/:id/read - Mark notification as read
 * - GET /api/v1/approvals/config - Get approval system configuration
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Rate limiting (read: 100 req/min)
 * - Audit logging for notification operations
 */
export function createSharedRoutes(): Router {
  const router = Router();

  // Apply audit logging middleware to all routes
  router.use(approvalAuditMiddleware);

  /**
   * GET /api/v1/notifications
   * 
   * List notifications for the authenticated user.
   * Supports pagination and filtering by read status.
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - pageSize: Items per page (default: 20, max: 100)
   * - read_status: Filter by read status ('true', 'false', 'all') (optional)
   * 
   * Response:
   * - 200: List of notifications with pagination metadata
   * - 400: Validation error
   * - 401: Authentication required
   * - 429: Rate limit exceeded
   * 
   * Requirements: 13.3-13.7
   */
  router.get(
    '/notifications',
    readOperationRateLimiter,
    validate(notificationListQuerySchema, 'query'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user!.userId;
        const { page, pageSize, read_status } = req.query;

        const pagination = {
          page: Number(page) || 1,
          pageSize: Number(pageSize) || 20,
        };

        // Build filters
        const filters: { read_status?: boolean } = {};
        if (read_status === 'true') {
          filters.read_status = true;
        } else if (read_status === 'false') {
          filters.read_status = false;
        }
        // If read_status is 'all' or undefined, don't filter by read_status

        const result = await notificationRepository.findByUserId(
          userId,
          filters,
          pagination
        );

        res.status(200).json({
          success: true,
          data: result.data,
          pagination: result.pagination,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PATCH /api/v1/notifications/:id/read
   * 
   * Mark a notification as read.
   * Only the notification owner can mark it as read.
   * 
   * Path Parameters:
   * - id: UUID of the notification
   * 
   * Response:
   * - 200: Notification marked as read successfully
   * - 400: Invalid UUID format
   * - 401: Authentication required
   * - 403: Permission denied (notification belongs to another user)
   * - 404: Notification not found
   * - 429: Rate limit exceeded
   * 
   * Requirements: 13.6
   */
  router.patch(
    '/notifications/:id/read',
    readOperationRateLimiter,
    validate(notificationIdParamSchema, 'params'),
    validate(markAsReadSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user!.userId;
        const notificationId = req.params.id;

        // Fetch the notification to verify ownership
        const notification = await notificationRepository.findById(notificationId);

        if (!notification) {
          res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Notification not found',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        // Verify the notification belongs to the authenticated user
        if (notification.user_id !== userId) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied. This notification belongs to another user.',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        // Mark as read
        const updatedNotification = await notificationRepository.markAsRead(notificationId);

        res.status(200).json({
          success: true,
          data: updatedNotification,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/approvals/config
   * 
   * Get approval system configuration.
   * Returns available entity types, categories, statuses, workflow rules,
   * pagination defaults, and notification priority levels.
   * 
   * Response:
   * - 200: Configuration object
   * - 401: Authentication required
   * - 429: Rate limit exceeded
   * 
   * Requirements: 14.1-14.6
   */
  router.get(
    '/approvals/config',
    readOperationRateLimiter,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const config = {
          entityTypes: Object.values(EntityType),
          categories: Object.values(Category),
          approvalStatuses: Object.values(ApprovalStatus),
          notificationTypes: Object.values(NotificationType),
          notificationPriorities: Object.values(NotificationPriority),
          workflowRules: {
            maxBulkOperationSize: 100,
            maxBulkOperationSizeAtomic: 50,
            backgroundJobThreshold: 20,
            maxRetryAttempts: 3,
            allowedStateTransitions: {
              draft: ['pending'],
              pending: ['approved', 'rejected', 'withdrawn', 'conflicted', 'failed'],
              conflicted: ['pending'],
              failed: ['pending'],
              approved: [],
              rejected: [],
              withdrawn: [],
            },
          },
          pagination: {
            defaultPageSize: 20,
            maxPageSize: 100,
          },
          rateLimits: {
            submission: {
              windowMs: 60000,
              max: 20,
            },
            bulkOperations: {
              windowMs: 60000,
              max: 5,
            },
            readOperations: {
              windowMs: 60000,
              max: 100,
            },
          },
        };

        res.status(200).json({
          success: true,
          data: config,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

// Default export for backward compatibility
export default createSharedRoutes();
