/**
 * Search Routes
 * Route definitions for search endpoints
 * 
 */

import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createSearchRoutes(searchController: SearchController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/search/students?q=query
   * Search students by name or student_id
   */
  router.get('/students', searchController.searchStudents);

  /**
   * GET /api/v1/admin/search/faculty?q=query
   * Search faculty by name or faculty_id
   */
  router.get('/faculty', searchController.searchFaculty);

  /**
   * GET /api/v1/admin/search/events?q=query
   * Search events by name or type
   */
  router.get('/events', searchController.searchEvents);

  /**
   * GET /api/v1/admin/search/research?q=query
   * Search research by title or author
   */
  router.get('/research', searchController.searchResearch);

  /**
   * GET /api/v1/admin/search?q=query&type=students
   * Global search across all entities or specific entity type
   * IMPORTANT: This route must come LAST to avoid route conflicts
   */
  router.get('/', searchController.globalSearch);

  return router;
}
