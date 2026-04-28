import { Router } from 'express';
import { StatisticsController } from '../controllers/statistics.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../shared/middleware/rbac.middleware';

/**
 * Create statistics routes
 * 
 * @param controller - Statistics controller instance
 * @returns Express router with statistics routes
 */
export function createStatisticsRoutes(controller: StatisticsController): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/instructions/statistics
   * Get comprehensive statistics for instructions module
   * 
   * Permissions: instruction.read or curriculum.read or subjects.read
   */
  router.get(
    '/instructions/statistics',
    requirePermission('instruction.read'),
    controller.getInstructionsStatistics
  );

  /**
   * GET /api/v1/admin/schedules/statistics
   * Get comprehensive statistics for schedules module
   * 
   * Query Parameters:
   * - semester: Filter by semester
   * - academic_year: Filter by academic year
   * 
   * Permissions: schedule.read
   */
  router.get(
    '/schedules/statistics',
    requirePermission('schedule.read'),
    controller.getSchedulesStatistics
  );

  return router;
}
