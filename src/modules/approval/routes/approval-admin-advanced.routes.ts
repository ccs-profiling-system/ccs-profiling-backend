/**
 * Admin Advanced Approval Routes
 * 
 * Defines advanced admin routes for:
 * - Audit log querying
 * - Retry failed change requests
 * - Background job status monitoring
 * 
 * All routes require authentication and appropriate admin permissions.
 * 
 * Requirements: 26.1-26.7, 31.1-31.10, 34.5-34.10
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { validate } from '../../../shared/middleware/validator';
import { approvalAuditMiddleware } from '../../../middleware/approval-audit.middleware';
import { readOperationRateLimiter } from '../middleware/approval-rate-limit.middleware';
import { z } from 'zod';
import { AuditLogRepository } from '../../audit-logs/repositories/auditLog.repository';
import { backgroundJobRepository } from '../repositories/background-job.repository';
import { approvalRepository } from '../repositories/approval.repository';
import { entityApplicationService } from '../services/entity-application.service';
import { approvalStateMachine } from '../services/approval-state-machine.service';
import { notificationService } from '../services/notification.service';
import { db } from '../../../db';
import { ApprovalStatus, type ApprovalStatusType } from '../../../db/schema/approvals';

/**
 * Validation Schemas
 */

// Audit log query schema
const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  user_id: z.string().uuid().optional(),
  action_type: z.string().optional(),
  change_request_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ID parameter schema
const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Retry request schema (empty body)
const retryRequestSchema = z.object({});

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
 * Create admin advanced routes router
 * 
 * Endpoints:
 * - GET /api/v1/audit-logs - Query audit logs
 * - PATCH /api/v1/approvals/:id/retry - Retry failed change request
 * - GET /api/v1/background-jobs/:id - Get background job status
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate admin permission for the operation
 * - Rate limiting (read: 100 req/min)
 * - Audit logging for retry operations
 */
export function createAdminAdvancedRoutes(): Router {
  const router = Router();

  // Initialize audit log repository
  const auditLogRepository = new AuditLogRepository(db);

  /**
   * GET /api/v1/audit-logs
   * 
   * Query audit logs with filtering and pagination.
   * Supports filtering by user, action type, change request, and date range.
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - pageSize: Items per page (default: 50, max: 100)
   * - user_id: Filter by user ID (optional)
   * - action_type: Filter by action type (optional)
   * - change_request_id: Filter by change request ID (optional)
   * - start_date: Filter by date start (YYYY-MM-DD) (optional)
   * - end_date: Filter by date end (YYYY-MM-DD) (optional)
   * - sort_order: Sort order ('asc' or 'desc', default: 'desc')
   * 
   * Response:
   * - 200: List of audit logs with pagination metadata
   * - 400: Validation error
   * - 401: Authentication required
   * - 403: Permission denied
   * - 429: Rate limit exceeded
   * 
   * Requirements: 26.1-26.7
   */
  router.get(
    '/audit-logs',
    readOperationRateLimiter,
    requirePermission('admin.audit.read'),
    validate(auditLogQuerySchema, 'query'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { page, pageSize, sort_order, ...filters } = req.query;

        const pagination = {
          page: Number(page) || 1,
          limit: Number(pageSize) || 50,
        };

        // Build filters for audit log repository
        const auditFilters = {
          ...filters,
          ...pagination,
        };

        const result = await auditLogRepository.findByDateRange(auditFilters);

        res.status(200).json({
          success: true,
          data: result.data,
          pagination: {
            total: result.meta.total,
            page: result.meta.page,
            pageSize: result.meta.limit,
            totalPages: result.meta.totalPages,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PATCH /api/v1/approvals/:id/retry
   * 
   * Retry a failed change request.
   * Re-validates the target entity and attempts to apply changes again.
   * Limited to 3 retry attempts per approval.
   * 
   * Path Parameters:
   * - id: UUID of the approval to retry
   * 
   * Response:
   * - 200: Retry successful, changes applied
   * - 400: Invalid UUID format, approval is not in failed status, or max retries exceeded
   * - 401: Authentication required
   * - 403: Permission denied
   * - 404: Approval not found
   * - 409: Conflict detected (entity has changed)
   * - 429: Rate limit exceeded
   * 
   * Requirements: 31.1-31.10
   */
  router.patch(
    '/approvals/:id/retry',
    readOperationRateLimiter,
    requirePermission('admin.approval.retry'),
    approvalAuditMiddleware,
    validate(idParamSchema, 'params'),
    validate(retryRequestSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const approvalId = req.params.id;
        const userId = req.user!.userId;

        // Fetch the approval
        const approval = await approvalRepository.findById(approvalId);

        if (!approval) {
          res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Approval not found',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        // Validate status is 'failed'
        if (!approvalStateMachine.canRetry(approval.status as ApprovalStatusType)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_STATE',
              message: `Cannot retry approval with status '${approval.status}'. Only failed approvals can be retried.`,
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        // Check retry count limit (max 3 attempts)
        if (approval.retry_count >= 3) {
          res.status(400).json({
            success: false,
            error: {
              code: 'MAX_RETRIES_EXCEEDED',
              message: 'Maximum retry attempts (3) exceeded for this approval',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        // Increment retry count
        await approvalRepository.update(approvalId, {
          retry_count: approval.retry_count + 1,
        });

        try {
          // Attempt to apply changes again
          await entityApplicationService.applyChanges(approvalId);

          // If successful, update status to 'approved' and record application timestamp
          const updatedApproval = await approvalRepository.update(approvalId, {
            status: ApprovalStatus.APPROVED,
            application_timestamp: new Date(),
            failure_reason: null,
          });

          // Create success notification for submitter
          await notificationService.createApprovalNotification(
            updatedApproval!,
            'approval_approved'
          );

          res.status(200).json({
            success: true,
            data: updatedApproval,
            message: 'Retry successful. Changes have been applied.',
          });
        } catch (error: any) {
          // If retry fails, keep status as 'failed' and update failure reason
          const updatedApproval = await approvalRepository.update(approvalId, {
            status: ApprovalStatus.FAILED,
            failure_reason: error.message || 'Unknown error during retry',
          });

          // Create failure notification
          await notificationService.createApprovalNotification(
            updatedApproval!,
            'application_failed'
          );

          res.status(400).json({
            success: false,
            error: {
              code: 'RETRY_FAILED',
              message: `Retry failed: ${error.message}`,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/background-jobs/:id
   * 
   * Get the status of a background job.
   * Returns job details including status, payload, result, and error information.
   * 
   * Path Parameters:
   * - id: UUID of the background job
   * 
   * Response:
   * - 200: Background job details
   * - 400: Invalid UUID format
   * - 401: Authentication required
   * - 403: Permission denied
   * - 404: Background job not found
   * - 429: Rate limit exceeded
   * 
   * Requirements: 34.5-34.10
   */
  router.get(
    '/background-jobs/:id',
    readOperationRateLimiter,
    requirePermission('admin.jobs.read'),
    validate(idParamSchema, 'params'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const jobId = req.params.id;

        const job = await backgroundJobRepository.findById(jobId);

        if (!job) {
          res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Background job not found',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: job,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

// Default export for backward compatibility
export default createAdminAdvancedRoutes();
