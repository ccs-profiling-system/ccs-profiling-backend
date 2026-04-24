/**
 * Approval Routes Index
 * 
 * Combines all approval system routes into a single router.
 * Routes are organized by role and functionality:
 * - Secretary routes: /api/v1/approvals (submission and management)
 * - Admin routes: /api/v1/approvals (review and bulk operations)
 * - Chair routes: /api/v1/approvals/department (department-scoped operations)
 * - Shared routes: /api/v1/notifications and /api/v1/approvals/config
 * 
 * All routes require authentication. Role-specific routes require
 * appropriate permissions enforced by middleware.
 */

import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { createSecretaryRoutes } from './approval-secretary.routes';
import { createAdminRoutes } from './approval-admin.routes';
import { createChairRoutes } from './approval-chair.routes';
import { createSharedRoutes } from './approval-shared.routes';
import { createAdminAdvancedRoutes } from './approval-admin-advanced.routes';

/**
 * Create the main approval router
 * 
 * Combines all approval routes with authentication middleware.
 * Routes are mounted at:
 * - /api/v1/approvals - Secretary and admin routes
 * - /api/v1/approvals/department - Chair routes
 * - /api/v1/notifications - Notification routes
 * - /api/v1/approvals/config - Configuration route
 */
export function createApprovalRouter(): Router {
  const router = Router();

  // Apply authentication middleware to all approval routes
  router.use(authMiddleware);

  // Shared routes (accessible to all authenticated users)
  // - GET /api/v1/notifications
  // - PATCH /api/v1/notifications/:id/read
  // - GET /api/v1/approvals/config
  router.use('/', createSharedRoutes());

  // Secretary routes
  // - POST /api/v1/approvals
  // - GET /api/v1/approvals/my-submissions
  // - GET /api/v1/approvals/my-submissions/:id
  // - PATCH /api/v1/approvals/:id/withdraw
  // - GET /api/v1/approvals/my-stats
  router.use('/approvals', createSecretaryRoutes());

  // Admin routes
  // - GET /api/v1/approvals/pending
  // - GET /api/v1/approvals/:id
  // - PATCH /api/v1/approvals/:id/approve
  // - PATCH /api/v1/approvals/:id/reject
  // - POST /api/v1/approvals/bulk-approve
  // - POST /api/v1/approvals/bulk-reject
  // - GET /api/v1/approvals/history
  // - GET /api/v1/approvals/stats
  router.use('/approvals', createAdminRoutes());

  // Chair routes (department-scoped)
  // - GET /api/v1/approvals/department/pending
  // - GET /api/v1/approvals/department/:id
  // - PATCH /api/v1/approvals/department/:id/approve
  // - PATCH /api/v1/approvals/department/:id/reject
  // - POST /api/v1/approvals/department/bulk-approve
  // - POST /api/v1/approvals/department/bulk-reject
  // - GET /api/v1/approvals/department/history
  // - GET /api/v1/approvals/department/stats
  router.use('/approvals', createChairRoutes());

  // Admin advanced routes
  // - GET /api/v1/audit-logs
  // - PATCH /api/v1/approvals/:id/retry
  // - GET /api/v1/background-jobs/:id
  router.use('/', createAdminAdvancedRoutes());

  return router;
}

// Default export
export const approvalRouter = createApprovalRouter();
