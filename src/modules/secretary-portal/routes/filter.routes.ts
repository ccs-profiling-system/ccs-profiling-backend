/**
 * Filter Routes
 * 
 * Defines routes for filter options in secretary portal.
 * All routes require authentication and secretary.filter.read permission.
 * 
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import {
  getPrograms,
  getDepartments,
  getEventTypes,
} from '../controllers/filter.controller';

/**
 * Create filter router
 * 
 * Endpoints:
 * - GET /api/secretary/filters/programs - Get distinct program names
 * - GET /api/secretary/filters/departments - Get distinct department names
 * - GET /api/secretary/filters/event-types - Get distinct event type names
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - secretary.filter.read permission
 */
export function createFilterRoutes(): Router {
  const router = Router();

  /**
   * GET /api/secretary/filters/programs
   * 
   * Retrieve distinct program names from students table.
   * Results are ordered alphabetically and exclude soft-deleted records.
   * Results are cached for 5 minutes for performance.
   * 
   * Response:
   * {
   *   success: true,
   *   data: string[]
   * }
   * 
   */
  router.get(
    '/programs',
    requirePermission('secretary.filter.read'),
    getPrograms
  );

  /**
   * GET /api/secretary/filters/departments
   * 
   * Retrieve distinct department names from faculty table.
   * Results are ordered alphabetically and exclude soft-deleted records.
   * Results are cached for 5 minutes for performance.
   * 
   * Response:
   * {
   *   success: true,
   *   data: string[]
   * }
   * 
   */
  router.get(
    '/departments',
    requirePermission('secretary.filter.read'),
    getDepartments
  );

  /**
   * GET /api/secretary/filters/event-types
   * 
   * Retrieve distinct event type names from events table.
   * Results are ordered alphabetically and exclude soft-deleted records.
   * Results are cached for 5 minutes for performance.
   * 
   * Response:
   * {
   *   success: true,
   *   data: string[]
   * }
   * 
   */
  router.get(
    '/event-types',
    requirePermission('secretary.filter.read'),
    getEventTypes
  );

  return router;
}

// Default export for backward compatibility
export default createFilterRoutes();
