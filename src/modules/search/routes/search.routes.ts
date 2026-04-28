/**
 * Search Routes
 * Route definitions for search endpoints
 * 
 */

import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createSearchRoutes(searchController: SearchController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/search/students?q=query
   * Search students by name or student_id
   * 
   * Permission: search.student
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/students', requirePermission('search.student'), searchController.searchStudents);

  /**
   * GET /api/v1/admin/search/faculty?q=query
   * Search faculty by name or faculty_id
   * 
   * Permission: search.department
   * Accessible by: Admin, Department Chair
   */
  router.get('/faculty', requirePermission('search.department'), searchController.searchFaculty);

  /**
   * GET /api/v1/admin/search/events?q=query
   * Search events by name or type
   * 
   * Permission: search.department
   * Accessible by: Admin, Department Chair
   */
  router.get('/events', requirePermission('search.department'), searchController.searchEvents);

  /**
   * GET /api/v1/admin/search/research?q=query
   * Search research by title or author
   * 
   * Permission: search.department
   * Accessible by: Admin, Department Chair
   */
  router.get('/research', requirePermission('search.department'), searchController.searchResearch);

  /**
   * GET /api/v1/admin/search?q=query&type=students
   * Global search across all entities or specific entity type
   * IMPORTANT: This route must come LAST to avoid route conflicts
   */
  router.get('/', searchController.globalSearch);

  return router;
}
