/**
 * Secretary Submission Routes
 * 
 * Defines routes for secretary approval system operations.
 * Secretaries can submit change requests, view their submissions,
 * withdraw pending requests, and view submission statistics.
 * 
 * All routes require authentication and appropriate permissions.
 * 
 * Requirements: 1.1-1.6, 2.1-2.7, 3.1-3.7
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { validate } from '../../../shared/middleware/validator';
import { approvalAuditMiddleware } from '../../../middleware/approval-audit.middleware';
import {
  submissionRateLimiter,
  readOperationRateLimiter,
} from '../middleware/approval-rate-limit.middleware';
import {
  submitChangeRequestSchema,
  withdrawRequestSchema,
  listQuerySchema,
  idParamSchema,
  calculatePaginationMeta,
} from '../schemas/approval.schemas';
import { approvalService } from '../services/approval.service';
import { approvalStatisticsService } from '../services/approval-statistics.service';

/**
 * Create secretary submission router
 * 
 * Endpoints:
 * - POST /api/v1/approvals - Submit change request
 * - GET /api/v1/approvals/my-submissions - List own submissions
 * - GET /api/v1/approvals/my-submissions/:id - Get submission details
 * - PATCH /api/v1/approvals/:id/withdraw - Withdraw pending submission
 * - GET /api/v1/approvals/my-stats - Get submission statistics
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate permission for the operation
 * - Rate limiting (submission: 20 req/min, read: 100 req/min)
 * - Audit logging for all operations
 */
export function createSecretaryRoutes(): Router {
  const router = Router();

  // Apply audit logging middleware to all routes
  router.use(approvalAuditMiddleware);

  /**
   * POST /api/v1/approvals
   * 
   * Submit a new change request.
   * 
   * Request Body:
   * - entity_type: 'student' | 'faculty' | 'event' | 'research'
   * - entity_id: UUID of the target entity
   * - category: 'research' | 'event' | 'profile' | 'general'
   * - change_details: Object containing the requested changes
   * - idempotency_key: Optional unique key for idempotency
   * 
   * Response:
   * - 201: Change request created successfully
   * - 400: Validation error
   * - 401: Authentication required
   * - 403: Permission denied
   * - 429: Rate limit exceeded
   * 
   * Requirements: 1.1-1.6
   */
  router.post(
    '/',
    submissionRateLimiter,
    requirePermission('approval.submit'),
    validate(submitChangeRequestSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user!.userId;
        const data = req.body;

        const approval = await approvalService.submitChangeRequest(data, userId);

        res.status(201).json({
          success: true,
          data: approval,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/approvals/my-submissions
   * 
   * List own submissions with pagination and filtering.
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - pageSize: Items per page (default: 20, max: 100)
   * - status: Filter by status (optional)
   * - entity_type: Filter by entity type (optional)
   * - category: Filter by category (optional)
   * - start_date: Filter by submission date start (YYYY-MM-DD) (optional)
   * - end_date: Filter by submission date end (YYYY-MM-DD) (optional)
   * 
   * Response:
   * - 200: List of submissions with pagination metadata
   * - 400: Validation error
   * - 401: Authentication required
   * - 403: Permission denied
   * - 429: Rate limit exceeded
   * 
   * Requirements: 2.1-2.5
   */
  router.get(
    '/my-submissions',
    readOperationRateLimiter,
    requirePermission('approval.read'),
    validate(listQuerySchema, 'query'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user!.userId;
        const { page, pageSize, ...filters } = req.query;

        const pagination = {
          page: Number(page) || 1,
          pageSize: Number(pageSize) || 20,
        };

        const result = await approvalService.getMySubmissions(
          userId,
          filters,
          pagination
        );

        const paginationMeta = calculatePaginationMeta(
          result.pagination.total,
          pagination.page,
          pagination.pageSize
        );

        res.status(200).json({
          success: true,
          data: result.data,
          pagination: paginationMeta,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/approvals/my-submissions/:id
   * 
   * Get details of a specific submission.
   * Only returns the submission if it belongs to the authenticated user.
   * 
   * Path Parameters:
   * - id: UUID of the approval
   * 
   * Response:
   * - 200: Submission details
   * - 400: Invalid UUID format
   * - 401: Authentication required
   * - 403: Permission denied or submission belongs to another user
   * - 404: Submission not found
   * - 429: Rate limit exceeded
   * 
   * Requirements: 2.5
   */
  router.get(
    '/my-submissions/:id',
    readOperationRateLimiter,
    requirePermission('approval.read'),
    validate(idParamSchema, 'params'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user!.userId;
        const approvalId = req.params.id;

        const approval = await approvalService.getApprovalById(approvalId);

        if (!approval) {
          res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Submission not found',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        // Verify the submission belongs to the authenticated user
        if (approval.submitter_id !== userId) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied. This submission belongs to another user.',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: approval,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PATCH /api/v1/approvals/:id/withdraw
   * 
   * Withdraw a pending submission.
   * Only pending submissions can be withdrawn.
   * Only the submitter can withdraw their own submission.
   * 
   * Path Parameters:
   * - id: UUID of the approval to withdraw
   * 
   * Response:
   * - 200: Submission withdrawn successfully
   * - 400: Invalid UUID format or submission is not pending
   * - 401: Authentication required
   * - 403: Permission denied or submission belongs to another user
   * - 404: Submission not found
   * - 429: Rate limit exceeded
   * 
   * Requirements: 2.6-2.7
   */
  router.patch(
    '/:id/withdraw',
    submissionRateLimiter,
    requirePermission('approval.withdraw'),
    validate(idParamSchema, 'params'),
    validate(withdrawRequestSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user!.userId;
        const approvalId = req.params.id;

        const approval = await approvalService.withdrawChangeRequest(approvalId, userId);

        res.status(200).json({
          success: true,
          data: approval,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/approvals/my-stats
   * 
   * Get submission statistics for the authenticated secretary.
   * 
   * Response:
   * - 200: Statistics object with counts by status, approval rate, etc.
   * - 401: Authentication required
   * - 403: Permission denied
   * - 429: Rate limit exceeded
   * 
   * Requirements: 3.1-3.7
   */
  router.get(
    '/my-stats',
    readOperationRateLimiter,
    requirePermission('approval.read'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user!.userId;

        const stats = await approvalStatisticsService.getSecretaryStats(userId);

        res.status(200).json({
          success: true,
          data: stats,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

// Default export for backward compatibility
export default createSecretaryRoutes();
