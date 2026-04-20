/**
 * Faculty Portal - Material Routes
 * Route definitions for course material management endpoints
 * 
 * Defines routes for uploading, viewing, and deleting course materials.
 * All routes require authentication and RBAC permission checks.
 * File uploads are handled using multer middleware with memory storage.
 * 
 * Requirements: 9.1, 9.12, 9.16, 14.1
 */

import { Router } from 'express';
import multer from 'multer';
import { MaterialController } from '../controllers/material.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { FILE_VALIDATION } from '../schemas/material.schema';

/**
 * Configure multer with memory storage for file uploads
 * Files are stored in memory as Buffer objects for processing by the storage service
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_VALIDATION.MAX_SIZE, // 10MB limit
  },
});

/**
 * Create material routes
 * 
 * All routes require authentication and faculty role with appropriate permissions.
 * Routes follow the pattern: /api/faculty/courses/:courseId/materials
 * 
 * @param materialController - Material controller instance
 * @returns Express router with material routes
 */
export function createMaterialRoutes(materialController: MaterialController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * POST /api/faculty/courses/:courseId/materials
   * Upload course material
   * 
   * Protected by: faculty.material.upload permission
   * Content-Type: multipart/form-data
   * 
   * Route Parameters:
   * - courseId: UUID of the course (instruction_id)
   * 
   * Request Body (multipart/form-data):
   * - file (required): The file to upload (max 10MB)
   * - title (required): Title of the material
   * - material_type (required): One of 'lecture_notes', 'assignment', 'reading_material', 'syllabus', 'exam', 'other'
   * - description (optional): Description of the material
   * 
   * Allowed file types: pdf, doc, docx, ppt, pptx, xls, xlsx, zip
   * 
   * Returns:
   * - 200: Material uploaded successfully with material details
   * - 400: File validation failed or invalid input data
   * - 403: Permission denied or course not assigned to faculty
   * - 404: Course not found
   * 
   * Requirements: 9.1, 14.1
   */
  router.post(
    '/courses/:courseId/materials',
    requirePermission('faculty.material.upload'),
    upload.single('file'),
    materialController.uploadMaterial
  );

  /**
   * GET /api/faculty/courses/:courseId/materials
   * Get all materials for a course
   * 
   * Protected by: faculty.material.read permission
   * 
   * Route Parameters:
   * - courseId: UUID of the course (instruction_id)
   * 
   * Returns:
   * - 200: Array of course materials ordered by upload date descending
   * - 400: Invalid course ID format
   * - 403: Permission denied or course not assigned to faculty
   * - 404: Course not found
   * 
   * Requirements: 9.12, 14.1
   */
  router.get(
    '/courses/:courseId/materials',
    requirePermission('faculty.material.read'),
    materialController.getMaterials
  );

  /**
   * DELETE /api/faculty/courses/:courseId/materials/:materialId
   * Delete a course material
   * 
   * Protected by: faculty.material.delete permission
   * 
   * Route Parameters:
   * - courseId: UUID of the course (instruction_id)
   * - materialId: UUID of the material to delete
   * 
   * Returns:
   * - 200: Material deleted successfully
   * - 400: Invalid course ID or material ID format
   * - 403: Permission denied or course not assigned to faculty
   * - 404: Material not found or doesn't belong to course
   * 
   * Requirements: 9.16, 14.1
   */
  router.delete(
    '/courses/:courseId/materials/:materialId',
    requirePermission('faculty.material.delete'),
    materialController.deleteMaterial
  );

  return router;
}
