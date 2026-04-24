/**
 * Admin Approval Routes
 * 
 * Defines routes for admin approval system operations.
 * Admins can review all pending approvals across all departments,
 * approve/reject change requests, perform bulk operations,
 * view approval history, and access system-wide statistics.
 * 
 * All routes require authentication and appropriate admin permissions.
 * 
 * Requirements: 4.1-4.6, 5.1-5.7, 6.1-6.6, 7.1-7.6, 8.1-8.7
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { validate } from '../../../shared/middleware/validator';
import { approvalAuditMiddleware } from '../../../middleware/approval-audit.middleware';
import {
  readOperationRateLimiter,
  bulkOperationRateLimiter,
} from '../middleware/approval-rate-limit.middleware';
import {
  listQuerySchema,
  idParamSchema,
  approveRequestSchema,
  rejectRequestSchema,
  bulkApproveSchema,
  bulkRejectSchema,
  calculatePaginationMeta,
} from '../schemas/approval.schemas';
import { approvalService } from '../services/approval.service';
import { approvalStatisticsService } from '../services/approval-statistics.service';
import { bulkOperationsService } from '../services/bulk-operations.service';

/**
 * Create admin approval router
 * 
 * Endpoints:
 * - GET /api/v1/approvals/pending - List all pending approvals
 * - GET /api/v1/approvals/:id - Get approval details
 * - PATCH /api/v1/approvals/:id/approve - Approve change request
 * - PATCH /api/v1/approvals/:id/reject - Reject change request
 * - POST /api/v1/approvals/bulk-approve - Bulk approve
 * - POST /api/v1/approvals/bulk-reject - Bulk reject
 * - GET /api/v1/approvals/history - List processed approvals
 * - GET /api/v1/approvals/stats - Get system-wide statistics
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate admin permission for the operation
 * - Rate limiting (bulk ops: 5 req/min, read: 100 req/min)
 * - Audit logging for all operations
 */
export function createAdminRoutes(): Router {
  const router = Router();

  // Apply audit logging middleware to all routes
  router.use(approvalAuditMiddleware);

  /**
   * GET /api/v1/approvals/pending
   * 
   * List all pending approvals across all departments.
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - pageSize: Items per page (default: 20, max: 100)
   * - entity_type: Filter by entity type (optional)
   * - category: Filter by category (optional)
   * - submitter_id: Filter by submitter (optional)
   * - start_date: Filter by submission date start (YYYY-MM-DD) (optional)
   * - end_date: Filter by submission date end (YYYY-MM-DD) (optional)
   * 
   * Response:
   * - 200: List of pending approvals with pagination metadata
   * - 400: Validation error
   * - 401: Authentication required
   * - 403: Permission denied
   * - 429: Rate limit exceeded
   * 
   * Requirements: 4.1-4.6
   */
  router.get(
    '/pending',
    readOperationRateLimiter,
    requirePermission('admin.approval.review'),
    validate(listQuerySchema, 'query'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { page, pageSize, ...filters } = req.query;

        const pagination = {
          page: Number(page) || 1,
          pageSize: Number(pageSize) || 20,
        };

        const result = await approvalService.getPendingApprovals(
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
   * GET /api/v1/approvals/:id
   * 
   * Get details of a specific approval.
   * Admins can view any approval across all departments.
   * 
   * Path Parameters:
   * - id: UUID of the approval
   * 
   * Response:
   * - 200: Approval details
   * - 400: Invalid UUID format
   * - 401: Authentication required
   * - 403: Permission denied
   * - 404: Approval not found
   * - 429: Rate limit exceeded
   * 
   * Requirements: 4.5
   */
  router.get(
    '/:id',
    readOperationRateLimiter,
    requirePermission('admin.approval.review'),
    validate(idParamSchema, 'params'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const approvalId = req.params.id;

        const approval = await approvalService.getApprovalById(approvalId);

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
   * PATCH /api/v1/approvals/:id/approve
   * 
   * Approve a change request.
   * Updates status to 'approved', applies changes to target entity,
   * and creates notification for submitter.
   * 
   * Path Parameters:
   * - id: UUID of the approval to approve
   * 
   * Request Body:
   * - comments: Optional approval comments
   * 
   * Response:
   * - 200: Approval approved successfully
   * - 400: Invalid UUID format or approval is not pending
   * - 401: Authentication required
   * - 403: Permission denied
   * - 404: Approval not found
   * - 409: Conflict detected (entity has changed)
   * - 429: Rate limit exceeded
   * 
   * Requirements: 5.1-5.7
   */
  router.patch(
    '/:id/approve',
    readOperationRateLimiter,
    requirePermission('admin.approval.approve'),
    validate(idParamSchema, 'params'),
    validate(approveRequestSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const reviewerId = req.user!.userId;
        const approvalId = req.params.id;
        const { comments } = req.body;

        const approval = await approvalService.approveChangeRequest(
          approvalId,
          reviewerId,
          comments
        );

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
   * PATCH /api/v1/approvals/:id/reject
   * 
   * Reject a change request.
   * Updates status to 'rejected' and creates notification for submitter.
   * Comments are required when rejecting.
   * 
   * Path Parameters:
   * - id: UUID of the approval to reject
   * 
   * Request Body:
   * - comments: Required rejection comments
   * 
   * Response:
   * - 200: Approval rejected successfully
   * - 400: Invalid UUID format, approval is not pending, or comments missing
   * - 401: Authentication required
   * - 403: Permission denied
   * - 404: Approval not found
   * - 429: Rate limit exceeded
   * 
   * Requirements: 5.1-5.7
   */
  router.patch(
    '/:id/reject',
    readOperationRateLimiter,
    requirePermission('admin.approval.reject'),
    validate(idParamSchema, 'params'),
    validate(rejectRequestSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const reviewerId = req.user!.userId;
        const approvalId = req.params.id;
        const { comments } = req.body;

        const approval = await approvalService.rejectChangeRequest(
          approvalId,
          reviewerId,
          comments
        );

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
   * POST /api/v1/approvals/bulk-approve
   * 
   * Bulk approve multiple change requests.
   * Supports independent mode (default) and atomic mode.
   * Operations with >20 items are queued as background jobs.
   * 
   * Request Body:
   * - approvalIds: Array of approval IDs (1-100 items)
   * - atomic: Optional boolean for atomic mode (default: false)
   * - comments: Optional approval comments
   * 
   * Response:
   * - 200: Bulk operation completed (independent mode)
   * - 202: Bulk operation queued (>20 items)
   * - 400: Validation error or invalid approval IDs
   * - 401: Authentication required
   * - 403: Permission denied
   * - 429: Rate limit exceeded
   * 
   * Requirements: 8.1-8.7
   */
  router.post(
    '/bulk-approve',
    bulkOperationRateLimiter,
    requirePermission('admin.approval.bulk'),
    validate(bulkApproveSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const reviewerId = req.user!.userId;
        const { approvalIds, atomic } = req.body;

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          atomic || false
        );

        // Check if result is a queued job response
        if ('jobId' in result) {
          res.status(202).json({
            success: true,
            data: result,
          });
          return;
        }

        // Return operation summary
        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/approvals/bulk-reject
   * 
   * Bulk reject multiple change requests.
   * Supports independent mode (default) and atomic mode.
   * Operations with >20 items are queued as background jobs.
   * Comments are required for bulk rejection.
   * 
   * Request Body:
   * - approvalIds: Array of approval IDs (1-100 items)
   * - comments: Required rejection comments
   * - atomic: Optional boolean for atomic mode (default: false)
   * 
   * Response:
   * - 200: Bulk operation completed (independent mode)
   * - 202: Bulk operation queued (>20 items)
   * - 400: Validation error, invalid approval IDs, or comments missing
   * - 401: Authentication required
   * - 403: Permission denied
   * - 429: Rate limit exceeded
   * 
   * Requirements: 8.1-8.7
   */
  router.post(
    '/bulk-reject',
    bulkOperationRateLimiter,
    requirePermission('admin.approval.bulk'),
    validate(bulkRejectSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const reviewerId = req.user!.userId;
        const { approvalIds, comments, atomic } = req.body;

        const result = await bulkOperationsService.bulkReject(
          approvalIds,
          reviewerId,
          comments,
          atomic || false
        );

        // Check if result is a queued job response
        if ('jobId' in result) {
          res.status(202).json({
            success: true,
            data: result,
          });
          return;
        }

        // Return operation summary
        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/approvals/history
   * 
   * List processed approvals (approved, rejected, withdrawn, failed, conflicted).
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - pageSize: Items per page (default: 20, max: 100)
   * - status: Filter by status (optional)
   * - entity_type: Filter by entity type (optional)
   * - category: Filter by category (optional)
   * - submitter_id: Filter by submitter (optional)
   * - reviewer_id: Filter by reviewer (optional)
   * - start_date: Filter by submission date start (YYYY-MM-DD) (optional)
   * - end_date: Filter by submission date end (YYYY-MM-DD) (optional)
   * 
   * Response:
   * - 200: List of processed approvals with pagination metadata
   * - 400: Validation error
   * - 401: Authentication required
   * - 403: Permission denied
   * - 429: Rate limit exceeded
   * 
   * Requirements: 7.1-7.6
   */
  router.get(
    '/history',
    readOperationRateLimiter,
    requirePermission('admin.approval.review'),
    validate(listQuerySchema, 'query'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { page, pageSize, ...filters } = req.query;

        const pagination = {
          page: Number(page) || 1,
          pageSize: Number(pageSize) || 20,
        };

        const result = await approvalService.getApprovalHistory(
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
   * GET /api/v1/approvals/stats
   * 
   * Get system-wide approval statistics.
   * Includes counts by status, approval/rejection rates,
   * average approval time, and pending approval metrics.
   * 
   * Response:
   * - 200: Statistics object
   * - 401: Authentication required
   * - 403: Permission denied
   * - 429: Rate limit exceeded
   * 
   * Requirements: 6.1-6.6
   */
  router.get(
    '/stats',
    readOperationRateLimiter,
    requirePermission('admin.approval.stats'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const stats = await approvalStatisticsService.getAdminStats();

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
export default createAdminRoutes();
