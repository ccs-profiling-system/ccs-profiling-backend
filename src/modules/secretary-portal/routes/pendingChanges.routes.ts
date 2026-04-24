/**
 * Pending Changes Routes
 * 
 * Defines routes for secretary portal pending changes operations.
 * All routes require authentication and appropriate permissions.
 * 
 * Requirements: 9.3-9.4
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import {
  getAllPendingChangesController,
  withdrawPendingChangeController,
} from '../controllers/pendingChanges.controller';

/**
 * Create pending changes router
 * 
 * Endpoints:
 * - GET /api/secretary/pending-changes - Get all pending changes with pagination and filtering
 * - DELETE /api/secretary/pending-changes/:id - Withdraw a pending change
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate permission for the operation
 */
export function createPendingChangesRoutes(): Router {
  const router = Router();

  /**
   * GET /api/secretary/pending-changes
   * 
   * Retrieve all pending changes with pagination and filtering.
   * 
   * Requirements: 9.1, 9.3
   */
  router.get(
    '/',
    requirePermission('secretary.pending.read'),
    getAllPendingChangesController
  );

  /**
   * DELETE /api/secretary/pending-changes/:id
   * 
   * Withdraw a pending change.
   * Changes status from 'pending_approval' to 'withdrawn'.
   * 
   * Requirements: 9.2, 9.4
   */
  router.delete(
    '/:id',
    requirePermission('secretary.pending.withdraw'),
    withdrawPendingChangeController
  );

  return router;
}

// Default export for backward compatibility
export default createPendingChangesRoutes();
