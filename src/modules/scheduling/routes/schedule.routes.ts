/**
 * Schedule Routes
 * Route definitions for schedule endpoints
 * 
 * Requirements: 13.1, 13.5, 13.6, 30.2
 */

import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createScheduleRoutes(scheduleController: ScheduleController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * POST /api/v1/admin/schedules/check-conflict
   * Check for schedule conflicts
   * Note: This must be defined before /:id to avoid route conflicts
   */
  router.post('/check-conflict', scheduleController.checkConflict);

  /**
   * GET /api/v1/admin/schedules/room/:room
   * Get schedules by room
   */
  router.get('/room/:room', scheduleController.getSchedulesByRoom);

  /**
   * GET /api/v1/admin/schedules/faculty/:facultyId
   * Get schedules by faculty ID
   */
  router.get('/faculty/:facultyId', scheduleController.getSchedulesByFaculty);

  /**
   * GET /api/v1/admin/schedules
   * List schedules with pagination and filters
   */
  router.get('/', scheduleController.listSchedules);

  /**
   * GET /api/v1/admin/schedules/:id
   * Get schedule by ID
   */
  router.get('/:id', scheduleController.getSchedule);

  /**
   * POST /api/v1/admin/schedules
   * Create a new schedule
   */
  router.post('/', scheduleController.createSchedule);

  /**
   * PUT /api/v1/admin/schedules/:id
   * Update schedule by ID
   */
  router.put('/:id', scheduleController.updateSchedule);

  /**
   * DELETE /api/v1/admin/schedules/:id
   * Delete schedule by ID
   */
  router.delete('/:id', scheduleController.deleteSchedule);

  return router;
}
