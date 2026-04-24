/**
 * Schedule Routes
 * 
 * Defines routes for secretary portal schedule operations.
 * All routes require authentication and appropriate permissions.
 * 
 * Requirements: 5.6-5.9
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import {
  getAllSchedulesController,
  getScheduleByIdController,
  createScheduleController,
  updateScheduleController,
  deleteScheduleController,
} from '../controllers/schedule.controller';

/**
 * Create schedule router
 * 
 * Endpoints:
 * - GET /api/secretary/schedules - Get all schedules with pagination and filtering
 * - GET /api/secretary/schedules/:id - Get schedule by ID
 * - POST /api/secretary/schedules - Create a new schedule
 * - PUT /api/secretary/schedules/:id - Update an existing schedule
 * - DELETE /api/secretary/schedules/:id - Delete a schedule (soft delete)
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate permission for the operation
 */
export function createScheduleRoutes(): Router {
  const router = Router();

  /**
   * GET /api/secretary/schedules
   * 
   * Retrieve all schedules with pagination and filtering.
   * 
   * Requirements: 5.1, 5.6
   */
  router.get(
    '/',
    requirePermission('secretary.schedule.read'),
    getAllSchedulesController
  );

  /**
   * GET /api/secretary/schedules/:id
   * 
   * Retrieve a schedule by ID.
   * 
   * Requirements: 5.2, 5.6
   */
  router.get(
    '/:id',
    requirePermission('secretary.schedule.read'),
    getScheduleByIdController
  );

  /**
   * POST /api/secretary/schedules
   * 
   * Create a new schedule.
   * 
   * Requirements: 5.3, 5.7
   */
  router.post(
    '/',
    requirePermission('secretary.schedule.create'),
    createScheduleController
  );

  /**
   * PUT /api/secretary/schedules/:id
   * 
   * Update an existing schedule.
   * 
   * Requirements: 5.4, 5.8
   */
  router.put(
    '/:id',
    requirePermission('secretary.schedule.update'),
    updateScheduleController
  );

  /**
   * DELETE /api/secretary/schedules/:id
   * 
   * Delete a schedule (soft delete).
   * 
   * Requirements: 5.5, 5.9
   */
  router.delete(
    '/:id',
    requirePermission('secretary.schedule.delete'),
    deleteScheduleController
  );

  return router;
}

// Default export for backward compatibility
export default createScheduleRoutes();
