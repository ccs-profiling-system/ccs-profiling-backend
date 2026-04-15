/**
 * Schedule Routes
 * Route definitions for schedule endpoints
 * 
 */

import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { auditContextMiddleware } from '../../../shared/middleware/auditContext.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createScheduleRoutes(scheduleController: ScheduleController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);
  router.use(auditContextMiddleware);

  /**
   * GET /api/v1/admin/schedules/deleted
   * Get soft-deleted schedules (admin only)
   * IMPORTANT: This route must come BEFORE other routes to avoid conflicts
   */
  router.get('/deleted', requirePermission('schedule.read'), scheduleController.getDeletedSchedules);

  /**
   * POST /api/v1/admin/schedules/check-conflict
   * Check for schedule conflicts
   * Note: This must be defined before /:id to avoid route conflicts
   */
  router.post('/check-conflict', requirePermission('schedule.read'), scheduleController.checkConflict);

  /**
   * GET /api/v1/admin/schedules/room/:room
   * Get schedules by room
   */
  router.get('/room/:room', requirePermission('schedule.read'), scheduleController.getSchedulesByRoom);

  /**
   * GET /api/v1/admin/schedules/faculty/:facultyId
   * Get schedules by faculty ID
   */
  router.get('/faculty/:facultyId', requirePermission('schedule.read'), scheduleController.getSchedulesByFaculty);

  /**
   * GET /api/v1/admin/schedules
   * List schedules with pagination and filters
   */
  router.get('/', requirePermission('schedule.read'), scheduleController.listSchedules);

  /**
   * GET /api/v1/admin/schedules/:id
   * Get schedule by ID
   */
  router.get('/:id', requirePermission('schedule.read'), scheduleController.getSchedule);

  /**
   * POST /api/v1/admin/schedules
   * Create a new schedule
   */
  router.post('/', requirePermission('schedule.create'), scheduleController.createSchedule);

  /**
   * PUT /api/v1/admin/schedules/:id
   * Update schedule by ID
   */
  router.put('/:id', requirePermission('schedule.update'), scheduleController.updateSchedule);

  /**
   * POST /api/v1/admin/schedules/:id/approve
   * Approve schedule (workflow operation)
   */
  router.post('/:id/approve', requirePermission('schedule.approve'), scheduleController.approveSchedule);

  /**
   * PATCH /api/v1/admin/schedules/:id/restore
   * Restore soft-deleted schedule
   */
  router.patch('/:id/restore', requirePermission('schedule.update'), scheduleController.restoreSchedule);

  /**
   * DELETE /api/v1/admin/schedules/:id/permanent
   * Permanently delete schedule (hard delete)
   */
  router.delete('/:id/permanent', requirePermission('schedule.delete'), scheduleController.permanentDeleteSchedule);

  /**
   * DELETE /api/v1/admin/schedules/:id
   * Delete schedule by ID (soft delete)
   */
  router.delete('/:id', requirePermission('schedule.delete'), scheduleController.deleteSchedule);

  return router;
}
