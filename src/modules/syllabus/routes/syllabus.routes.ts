/**
 * Syllabus Routes
 * Route definitions for syllabus endpoints (nested under subjects)
 */

import { Router } from 'express';
import { SyllabusController } from '../controllers/syllabus.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { uploadSyllabus } from '../../../shared/middleware/upload.middleware';

export function createSyllabusRoutes(syllabusController: SyllabusController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/subjects/:subjectId/syllabus
   * Get syllabus for a subject
   * 
   * Permission: syllabus.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get(
    '/:subjectId/syllabus',
    requirePermission('syllabus.read'),
    syllabusController.getSyllabus
  );

  /**
   * POST /api/v1/admin/subjects/:subjectId/syllabus
   * Create/upload syllabus for a subject
   * 
   * Permission: syllabus.create
   * Accessible by: Admin, Department Chair, Faculty
   */
  router.post(
    '/:subjectId/syllabus',
    requirePermission('syllabus.create'),
    uploadSyllabus.single('file'),
    syllabusController.createSyllabus
  );

  /**
   * PUT /api/v1/admin/subjects/:subjectId/syllabus
   * Update syllabus for a subject
   * 
   * Permission: syllabus.update
   * Accessible by: Admin, Department Chair, Faculty
   */
  router.put(
    '/:subjectId/syllabus',
    requirePermission('syllabus.update'),
    uploadSyllabus.single('file'),
    syllabusController.updateSyllabus
  );

  /**
   * DELETE /api/v1/admin/subjects/:subjectId/syllabus
   * Delete syllabus for a subject
   * 
   * Permission: syllabus.delete
   * Accessible by: Admin, Department Chair
   */
  router.delete(
    '/:subjectId/syllabus',
    requirePermission('syllabus.delete'),
    syllabusController.deleteSyllabus
  );

  return router;
}
