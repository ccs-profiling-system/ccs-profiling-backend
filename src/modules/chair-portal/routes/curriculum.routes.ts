/**
 * Curriculum Routes for Chair Portal
 * 
 * Defines routes for curriculum and subjects read-only operations.
 * All routes require JWT authentication and chair.curriculum.read permission.
 * 
 */

import { Router } from 'express';
import { CurriculumController } from '../controllers/curriculum.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create curriculum routes
 * 
 * @param curriculumController - Curriculum controller instance
 * @returns Express router with curriculum routes
 */
export function createCurriculumRoutes(curriculumController: CurriculumController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/v1/chair/curriculum
   * 
   * Get curriculum list with pagination and filters
   * 
   * Query Parameters:
   * - page: number (optional, default: 1)
   * - limit: number (optional, default: 10, max: 100)
   * - search: string (optional, searches name, code, program)
   * - program: string (optional, filter by program)
   * - year: string (optional, filter by year)
   * - status: string (optional, filter by status: draft, active, inactive)
   * 
   * Permissions: chair.curriculum.read
   * 
   * Response:
   * - 200: Curriculum list with pagination metadata
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('chair.curriculum.read'), curriculumController.getCurriculum);

  /**
   * GET /api/v1/chair/curriculum/stats
   * 
   * Get curriculum statistics
   * 
   * Permissions: chair.curriculum.read
   * 
   * Response:
   * - 200: Curriculum statistics
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/stats', requirePermission('chair.curriculum.read'), curriculumController.getStats);

  /**
   * GET /api/v1/chair/curriculum/export/pdf
   * 
   * Export curriculum to PDF
   * 
   * Query Parameters: Same as GET /api/v1/chair/curriculum
   * 
   * Permissions: chair.curriculum.read
   * 
   * Response:
   * - 200: PDF file download
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/export/pdf', requirePermission('chair.curriculum.read'), curriculumController.exportToPDF);

  /**
   * GET /api/v1/chair/curriculum/export/excel
   * 
   * Export curriculum to Excel
   * 
   * Query Parameters: Same as GET /api/v1/chair/curriculum
   * 
   * Permissions: chair.curriculum.read
   * 
   * Response:
   * - 200: Excel file download
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/export/excel', requirePermission('chair.curriculum.read'), curriculumController.exportToExcel);

  /**
   * GET /api/v1/chair/curriculum/:id
   * 
   * Get curriculum by ID
   * 
   * Path Parameters:
   * - id: string (UUID)
   * 
   * Permissions: chair.curriculum.read
   * 
   * Response:
   * - 200: Curriculum details
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.curriculum.read permission)
   * - 404: Not Found (curriculum not found)
   * - 500: Internal Server Error
   */
  router.get('/:id', requirePermission('chair.curriculum.read'), curriculumController.getCurriculumById);

  return router;
}

/**
 * Create subjects routes
 * 
 * @param curriculumController - Curriculum controller instance
 * @returns Express router with subjects routes
 */
export function createSubjectsRoutes(curriculumController: CurriculumController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/v1/chair/subjects
   * 
   * Get subjects list with pagination and filters
   * 
   * Query Parameters:
   * - page: number (optional, default: 1)
   * - limit: number (optional, default: 10, max: 100)
   * - search: string (optional, searches name, code)
   * - curriculum_id: string (optional, filter by curriculum UUID)
   * - year_level: number (optional, filter by year level: 1-4)
   * - semester: number (optional, filter by semester: 1-2)
   * - type: string (optional, filter by type: core, elective, major, minor, general_education)
   * 
   * Permissions: chair.curriculum.read
   * 
   * Response:
   * - 200: Subjects list with pagination metadata
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('chair.curriculum.read'), curriculumController.getSubjects);

  /**
   * GET /api/v1/chair/subjects/:id
   * 
   * Get subject by ID
   * 
   * Path Parameters:
   * - id: string (UUID)
   * 
   * Permissions: chair.curriculum.read
   * 
   * Response:
   * - 200: Subject details
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.curriculum.read permission)
   * - 404: Not Found (subject not found)
   * - 500: Internal Server Error
   */
  router.get('/:id', requirePermission('chair.curriculum.read'), curriculumController.getSubjectById);

  return router;
}
