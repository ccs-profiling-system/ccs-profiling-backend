/**
 * Schedule Occurrence Routes
 * Route definitions for schedule occurrence endpoints (nested under schedules)
 */

import { Router } from 'express';
import { OccurrenceController } from '../controllers/occurrence.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createOccurrenceRoutes(occurrenceController: OccurrenceController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/schedules/:scheduleId/occurrences
   * Get all occurrences for a schedule
   * 
   * Permission: schedule.read
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.get(
    '/:scheduleId/occurrences',
    requirePermission('schedule.read'),
    occurrenceController.getOccurrences
  );

  /**
   * PUT /api/v1/admin/schedules/:scheduleId/occurrences/:occurrenceId/cancel
   * Cancel an occurrence
   * 
   * Permission: schedule.update
   * Accessible by: Admin, Department Chair
   */
  router.put(
    '/:scheduleId/occurrences/:occurrenceId/cancel',
    requirePermission('schedule.update'),
    occurrenceController.cancelOccurrence
  );

  /**
   * PUT /api/v1/admin/schedules/:scheduleId/occurrences/:occurrenceId/restore
   * Restore a cancelled occurrence
   * 
   * Permission: schedule.update
   * Accessible by: Admin, Department Chair
   */
  router.put(
    '/:scheduleId/occurrences/:occurrenceId/restore',
    requirePermission('schedule.update'),
    occurrenceController.restoreOccurrence
  );

  return router;
}
