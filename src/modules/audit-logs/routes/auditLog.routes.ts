/**
 * Audit Log Routes
 * Route definitions for audit log endpoints
 * 
 */

import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createAuditLogRoutes(auditLogController: AuditLogController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/audit-logs/user/:userId
   * Get audit logs by user ID
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: audit_log.read
   * Accessible by: Admin, Department Chair
   */
  router.get('/user/:userId', requirePermission('audit_log.read'), auditLogController.getAuditLogsByUser);

  /**
   * GET /api/v1/admin/audit-logs/entity/:entityType/:entityId
   * Get audit logs by entity type and ID
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: audit_log.read
   * Accessible by: Admin, Department Chair
   */
  router.get('/entity/:entityType/:entityId', requirePermission('audit_log.read'), auditLogController.getAuditLogsByEntity);

  /**
   * GET /api/v1/admin/audit-logs
   * List audit logs with date range filtering
   * 
   * Permission: audit_log.read
   * Accessible by: Admin, Department Chair
   */
  router.get('/', requirePermission('audit_log.read'), auditLogController.listAuditLogs);

  /**
   * GET /api/v1/admin/audit-logs/:id
   * Get audit log by ID
   * 
   * Permission: audit_log.read
   * Accessible by: Admin, Department Chair
   */
  router.get('/:id', requirePermission('audit_log.read'), auditLogController.getAuditLog);

  return router;
}
