/**
 * Chair Department Routes
 * 
 * Defines routes for department chair approval system operations.
 * Chairs can review pending approvals within their department,
 * approve/reject change requests, perform bulk operations,
 * view approval history, and access department-scoped statistics.
 * 
 * All routes require authentication and appropriate chair permissions.
 * Department scope is strictly enforced - chairs can only access
 * approvals for their assigned department.
 * 
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { validate } from '../../../shared/middleware/validator';
import { approvalAuditMiddleware } from '../../../middleware/approval-audit.middleware';
import { extractDepartmentFromRequest } from '../../chair-portal/utils/departmentScope';
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
import { isDepartmentScopeMatch } from '../utils/departmentScope';

/**
 * Create chair department router
 * 
 * Endpoints:
 * - GET /api/v1/approvals/department/pending - List department pending approvals
 * - GET /api/v1/approvals/department/:id - Get department approval details
 * - PATCH /api/v1/approvals/department/:id/approve - Approve department change request
 * - PATCH /api/v1/approvals/department/:id/reject - Reject department change request
 * - POST /api/v1/approvals/department/bulk-approve - Bulk approve department requests
 * - POST /api/v1/approvals/department/bulk-reject - Bulk reject department requests
 * - GET /api/v1/approvals/department/history - List department approval history
 * - GET /api/v1/approvals/department/stats - Get department statistics
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate chair permission for the operation
 * - Department scope validation (chair can only access their department)
 * - Rate limiting (bulk ops: 5 req/min, read: 100 req/min)
 * - Audit logging for all operations
 */
export function createChairRoutes(): Router {
  const router = Router();

  // Apply audit logging middleware to all routes
  router.use(approvalAuditMiddleware);

  /**
   * GET /api/v1/approvals/department/pending
   * 
   * List pending approvals within the chair's department.
   * Results are automatically filtered to the chair's department.
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
   * - 403: Permission denied or no department assigned
   * - 429: Rate limit exceeded
   * 
   */
  router.get(
    '/pending',
    readOperationRateLimiter,
    requirePermission('approval.review'),
    validate(listQuerySchema, 'query'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const departmentInfo = await extractDepartmentFromRequest(req);
        const departmentId = departmentInfo.departmentId;

        const { page, pageSize, ...filters } = req.query;

        const pagination = {
          page: Number(page) || 1,
          pageSize: Number(pageSize) || 20,
        };

        const result = await approvalService.getPendingApprovals(
          filters,
          pagination,
          departmentId
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
   * GET /api/v1/approvals/department/history
   * 
   * List processed approvals within the chair's department.
   * Includes approved, rejected, withdrawn, failed, and conflicted approvals.
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
   * - 403: Permission denied or no department assigned
   * - 429: Rate limit exceeded
   * 
   */
  router.get(
    '/history',
    readOperationRateLimiter,
    requirePermission('approval.review'),
    validate(listQuerySchema, 'query'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const departmentInfo = await extractDepartmentFromRequest(req);
        const departmentId = departmentInfo.departmentId;

        const { page, pageSize, ...filters } = req.query;

        const pagination = {
          page: Number(page) || 1,
          pageSize: Number(pageSize) || 20,
        };

        const result = await approvalService.getApprovalHistory(
          filters,
          pagination,
          departmentId
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
   * GET /api/v1/approvals/department/stats
   * 
   * Get approval statistics for the chair's department.
   * Includes counts by status, approval/rejection rates,
   * average approval time, and pending approval metrics.
   * 
   * Response:
   * - 200: Statistics object
   * - 401: Authentication required
   * - 403: Permission denied or no department assigned
   * - 429: Rate limit exceeded
   * 
   */
  router.get(
    '/stats',
    readOperationRateLimiter,
    requirePermission('approval.stats'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const departmentInfo = await extractDepartmentFromRequest(req);
        const departmentId = departmentInfo.departmentId;

        const stats = await approvalStatisticsService.getChairStats(departmentId);

        res.status(200).json({
          success: true,
          data: stats,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/approvals/department/:id
   * 
   * Get details of a specific approval within the chair's department.
   * Access is denied if the approval belongs to a different department.
   * 
   * IMPORTANT: This route must be defined AFTER all specific routes
   * (like /pending, /history, /stats) to avoid matching them as :id parameter.
   * 
   * Path Parameters:
   * - id: UUID of the approval
   * 
   * Response:
   * - 200: Approval details
   * - 400: Invalid UUID format
   * - 401: Authentication required
   * - 403: Permission denied or approval outside department
   * - 404: Approval not found
   * - 429: Rate limit exceeded
   * 
   */
  router.get(
    '/:id',
    readOperationRateLimiter,
    requirePermission('approval.review'),
    validate(idParamSchema, 'params'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const departmentInfo = await extractDepartmentFromRequest(req);
        const departmentId = departmentInfo.departmentId;
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

        // Verify the approval belongs to the chair's department
        if (!isDepartmentScopeMatch(approval.department_id, departmentId)) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied. This approval belongs to a different department.',
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
   * PATCH /api/v1/approvals/department/:id/approve
   * 
   * Approve a change request within the chair's department.
   * Updates status to 'approved', applies changes to target entity,
   * and creates notification for submitter.
   * 
   * Path Parameters:
   * - id: UUID of the approval to approve
   * 
   * Request Body:
   * - comments: Optional approval comments
   * - force: Optional boolean to force approval despite conflicts (default: false)
   * 
   * Response:
   * - 200: Approval approved successfully
   * - 400: Invalid UUID format or approval is not pending
   * - 401: Authentication required
   * - 403: Permission denied or approval outside department
   * - 404: Approval not found
   * - 409: Conflict detected (entity has changed) - use force=true to override
   * - 429: Rate limit exceeded
   * 
   */
  router.patch(
    '/:id/approve',
    readOperationRateLimiter,
    requirePermission('approval.approve'),
    validate(idParamSchema, 'params'),
    validate(approveRequestSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const reviewerId = req.user!.userId;
        const departmentInfo = await extractDepartmentFromRequest(req);
        const departmentId = departmentInfo.departmentId;
        const approvalId = req.params.id;
        const { comments, force } = req.body;

        // Verify the approval belongs to the chair's department
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

        if (!isDepartmentScopeMatch(approval.department_id, departmentId)) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied. This approval belongs to a different department.',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        const updatedApproval = await approvalService.approveChangeRequest(
          approvalId,
          reviewerId,
          comments,
          force
        );

        res.status(200).json({
          success: true,
          data: updatedApproval,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PATCH /api/v1/approvals/department/:id/reject
   * 
   * Reject a change request within the chair's department.
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
   * - 403: Permission denied or approval outside department
   * - 404: Approval not found
   * - 429: Rate limit exceeded
   * 
   */
  router.patch(
    '/:id/reject',
    readOperationRateLimiter,
    requirePermission('approval.reject'),
    validate(idParamSchema, 'params'),
    validate(rejectRequestSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const reviewerId = req.user!.userId;
        const departmentInfo = await extractDepartmentFromRequest(req);
        const departmentId = departmentInfo.departmentId;
        const approvalId = req.params.id;
        const { comments } = req.body;

        // Verify the approval belongs to the chair's department
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

        if (!isDepartmentScopeMatch(approval.department_id, departmentId)) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied. This approval belongs to a different department.',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        const updatedApproval = await approvalService.rejectChangeRequest(
          approvalId,
          reviewerId,
          comments
        );

        res.status(200).json({
          success: true,
          data: updatedApproval,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/approvals/department/bulk-approve
   * 
   * Bulk approve multiple change requests within the chair's department.
   * Supports independent mode (default) and atomic mode.
   * Operations with >20 items are queued as background jobs.
   * Only approvals within the chair's department will be processed.
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
   * - 403: Permission denied or no department assigned
   * - 429: Rate limit exceeded
   * 
   */
  router.post(
    '/bulk-approve',
    bulkOperationRateLimiter,
    requirePermission('approval.bulk'),
    validate(bulkApproveSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const reviewerId = req.user!.userId;
        const departmentInfo = await extractDepartmentFromRequest(req);
        const departmentId = departmentInfo.departmentId;
        const { approvalIds, atomic } = req.body;

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          atomic || false,
          departmentId
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
   * POST /api/v1/approvals/department/bulk-reject
   * 
   * Bulk reject multiple change requests within the chair's department.
   * Supports independent mode (default) and atomic mode.
   * Operations with >20 items are queued as background jobs.
   * Comments are required for bulk rejection.
   * Only approvals within the chair's department will be processed.
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
   * - 403: Permission denied or no department assigned
   * - 429: Rate limit exceeded
   * 
   */
  router.post(
    '/bulk-reject',
    bulkOperationRateLimiter,
    requirePermission('approval.bulk'),
    validate(bulkRejectSchema, 'body'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const reviewerId = req.user!.userId;
        const departmentInfo = await extractDepartmentFromRequest(req);
        const departmentId = departmentInfo.departmentId;
        const { approvalIds, comments, atomic } = req.body;

        const result = await bulkOperationsService.bulkReject(
          approvalIds,
          reviewerId,
          comments,
          atomic || false,
          departmentId
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

  return router;
}

// Default export for backward compatibility
export default createChairRoutes();
