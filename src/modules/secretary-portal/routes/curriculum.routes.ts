/**
 * Curriculum Routes for Secretary Portal
 * 
 * Defines routes for curriculum and subjects CRUD operations.
 * All routes require JWT authentication and appropriate secretary permissions.
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
   * GET /api/secretary/curriculum/stats
   * 
   * Get curriculum statistics
   * 
   * Permissions: secretary.curriculum.read
   * 
   * Response:
   * - 200: Curriculum statistics
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/stats', requirePermission('secretary.curriculum.read'), curriculumController.getStats);

  /**
   * GET /api/secretary/curriculum/export/pdf
   * 
   * Export curriculum to PDF
   * 
   * Query Parameters: Same as GET /api/secretary/curriculum
   * 
   * Permissions: secretary.curriculum.read
   * 
   * Response:
   * - 200: PDF file download
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/export/pdf', requirePermission('secretary.curriculum.read'), curriculumController.exportToPDF);

  /**
   * GET /api/secretary/curriculum/export/excel
   * 
   * Export curriculum to Excel
   * 
   * Query Parameters: Same as GET /api/secretary/curriculum
   * 
   * Permissions: secretary.curriculum.read
   * 
   * Response:
   * - 200: Excel file download
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/export/excel', requirePermission('secretary.curriculum.read'), curriculumController.exportToExcel);

  /**
   * GET /api/secretary/curriculum
   * 
   * Get curriculum list with pagination and filters
   * 
   * Query Parameters:
   * - page: number (optional, default: 1)
   * - limit: number (optional, default: 20, max: 100)
   * - search: string (optional, searches name, code, description)
   * - program: string (optional, filter by program)
   * - year: number (optional, filter by year)
   * - status: string (optional, filter by status: draft, active, inactive)
   * - sort: string (optional, field to sort by)
   * - order: string (optional, sort order: asc, desc)
   * 
   * Permissions: secretary.curriculum.read
   * 
   * Response:
   * - 200: Curriculum list with pagination metadata
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('secretary.curriculum.read'), curriculumController.getCurriculum);

  /**
   * POST /api/secretary/curriculum
   * 
   * Create new curriculum
   * 
   * Request Body:
   * - code: string (required, max 50 chars)
   * - name: string (required, max 255 chars)
   * - program: string (required, max 100 chars)
   * - year: number (required)
   * - status: string (optional, enum: draft, active, inactive)
   * - description: string (optional)
   * 
   * Permissions: secretary.curriculum.create
   * 
   * Response:
   * - 201: Created curriculum
   * - 400: Bad Request (validation error)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.create permission)
   * - 409: Conflict (curriculum code already exists)
   * - 500: Internal Server Error
   */
  router.post('/', requirePermission('secretary.curriculum.create'), curriculumController.createCurriculum);

  /**
   * GET /api/secretary/curriculum/:id
   * 
   * Get curriculum by ID
   * 
   * Path Parameters:
   * - id: string (UUID)
   * 
   * Permissions: secretary.curriculum.read
   * 
   * Response:
   * - 200: Curriculum details
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.read permission)
   * - 404: Not Found (curriculum not found)
   * - 500: Internal Server Error
   */
  router.get('/:id', requirePermission('secretary.curriculum.read'), curriculumController.getCurriculumById);

  /**
   * PUT /api/secretary/curriculum/:id
   * 
   * Update curriculum
   * 
   * Path Parameters:
   * - id: string (UUID)
   * 
   * Request Body:
   * - code: string (optional, max 50 chars)
   * - name: string (optional, max 255 chars)
   * - status: string (optional, enum: draft, active, inactive)
   * - description: string (optional)
   * 
   * Permissions: secretary.curriculum.update
   * 
   * Response:
   * - 200: Updated curriculum
   * - 400: Bad Request (validation error)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.update permission)
   * - 404: Not Found (curriculum not found)
   * - 409: Conflict (curriculum code already exists)
   * - 500: Internal Server Error
   */
  router.put('/:id', requirePermission('secretary.curriculum.update'), curriculumController.updateCurriculum);

  /**
   * DELETE /api/secretary/curriculum/:id
   * 
   * Delete curriculum (soft delete)
   * 
   * Path Parameters:
   * - id: string (UUID)
   * 
   * Permissions: secretary.curriculum.delete
   * 
   * Response:
   * - 200: Success message
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.delete permission)
   * - 404: Not Found (curriculum not found)
   * - 500: Internal Server Error
   */
  router.delete('/:id', requirePermission('secretary.curriculum.delete'), curriculumController.deleteCurriculum);

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
   * GET /api/secretary/subjects
   * 
   * Get subjects list with pagination and filters
   * 
   * Query Parameters:
   * - page: number (optional, default: 1)
   * - limit: number (optional, default: 20, max: 100)
   * - search: string (optional, searches name, code, description)
   * - curriculum_id: string (optional, filter by curriculum UUID)
   * - yearLevel: number (optional, filter by year level: 1-4)
   * - semester: number (optional, filter by semester: 1-2)
   * - type: string (optional, filter by type: core, elective, major, minor, general_education)
   * - sort: string (optional, field to sort by)
   * - order: string (optional, sort order: asc, desc)
   * 
   * Permissions: secretary.curriculum.read
   * 
   * Response:
   * - 200: Subjects list with pagination metadata
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.read permission)
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('secretary.curriculum.read'), curriculumController.getSubjects);

  /**
   * POST /api/secretary/subjects
   * 
   * Create new subject
   * 
   * Request Body:
   * - code: string (required, max 50 chars)
   * - name: string (required, max 255 chars)
   * - curriculum_id: string (required, UUID)
   * - type: string (required, enum: core, elective, major, minor, general_education)
   * - units: number (required, 1-6)
   * - semester: number (required, 1-2)
   * - year_level: number (required, 1-4)
   * - lecture_hours: number (required, min 0)
   * - laboratory_hours: number (required, min 0)
   * - description: string (optional)
   * - prerequisites: string[] (optional)
   * - objectives: string[] (optional)
   * - topics: string[] (optional)
   * 
   * Permissions: secretary.curriculum.create
   * 
   * Response:
   * - 201: Created subject
   * - 400: Bad Request (validation error)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.create permission)
   * - 404: Not Found (curriculum not found)
   * - 409: Conflict (subject code already exists)
   * - 500: Internal Server Error
   */
  router.post('/', requirePermission('secretary.curriculum.create'), curriculumController.createSubject);

  /**
   * GET /api/secretary/subjects/:id
   * 
   * Get subject by ID
   * 
   * Path Parameters:
   * - id: string (UUID)
   * 
   * Permissions: secretary.curriculum.read
   * 
   * Response:
   * - 200: Subject details
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.read permission)
   * - 404: Not Found (subject not found)
   * - 500: Internal Server Error
   */
  router.get('/:id', requirePermission('secretary.curriculum.read'), curriculumController.getSubjectById);

  /**
   * PUT /api/secretary/subjects/:id
   * 
   * Update subject
   * 
   * Path Parameters:
   * - id: string (UUID)
   * 
   * Request Body:
   * - name: string (optional, max 255 chars)
   * - units: number (optional, 1-6)
   * - description: string (optional)
   * - prerequisites: string[] (optional)
   * - objectives: string[] (optional)
   * - topics: string[] (optional)
   * 
   * Permissions: secretary.curriculum.update
   * 
   * Response:
   * - 200: Updated subject
   * - 400: Bad Request (validation error)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.update permission)
   * - 404: Not Found (subject not found)
   * - 500: Internal Server Error
   */
  router.put('/:id', requirePermission('secretary.curriculum.update'), curriculumController.updateSubject);

  /**
   * DELETE /api/secretary/subjects/:id
   * 
   * Delete subject (soft delete)
   * 
   * Path Parameters:
   * - id: string (UUID)
   * 
   * Permissions: secretary.curriculum.delete
   * 
   * Response:
   * - 200: Success message
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing secretary.curriculum.delete permission)
   * - 404: Not Found (subject not found)
   * - 500: Internal Server Error
   */
  router.delete('/:id', requirePermission('secretary.curriculum.delete'), curriculumController.deleteSubject);

  return router;
}
