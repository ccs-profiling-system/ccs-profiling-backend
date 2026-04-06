/**
 * Audit Log Routes
 * Route definitions for audit log endpoints
 * 
 * Requirements: 19.5, 30.2
 */

import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createAuditLogRoutes(auditLogController: AuditLogController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/audit-logs/user/:userId
   * Get audit logs by user ID
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/user/:userId', auditLogController.getAuditLogsByUser);

  /**
   * GET /api/v1/admin/audit-logs/entity/:entityType/:entityId
   * Get audit logs by entity type and ID
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/entity/:entityType/:entityId', auditLogController.getAuditLogsByEntity);

  /**
   * GET /api/v1/admin/audit-logs
   * List audit logs with date range filtering
   */
  router.get('/', auditLogController.listAuditLogs);

  /**
   * GET /api/v1/admin/audit-logs/:id
   * Get audit log by ID
   */
  router.get('/:id', auditLogController.getAuditLog);

  return router;
}
