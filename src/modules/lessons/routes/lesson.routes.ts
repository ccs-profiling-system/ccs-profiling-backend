/**
 * Lesson Routes
 * Route definitions for lesson endpoints
 */

import { Router } from 'express';
import { LessonController } from '../controllers/lesson.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { uploadLesson } from '../../../shared/middleware/upload.middleware';

export function createLessonRoutes(lessonController: LessonController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/subjects/:subjectId/lessons
   * Get all lessons for a subject
   * 
   * Permission: lessons.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get(
    '/:subjectId/lessons',
    requirePermission('lessons.read'),
    lessonController.getLessons
  );

  /**
   * POST /api/v1/admin/subjects/:subjectId/lessons
   * Create/upload lesson for a subject
   * 
   * Permission: lessons.create
   * Accessible by: Admin, Department Chair, Faculty
   */
  router.post(
    '/:subjectId/lessons',
    requirePermission('lessons.create'),
    uploadLesson.single('file'),
    lessonController.createLesson
  );

  return router;
}

export function createLessonDetailRoutes(lessonController: LessonController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/lessons/:id
   * Get lesson by ID
   * 
   * Permission: lessons.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:id', requirePermission('lessons.read'), lessonController.getLesson);

  /**
   * PUT /api/v1/admin/lessons/:id
   * Update lesson
   * 
   * Permission: lessons.update
   * Accessible by: Admin, Department Chair, Faculty
   */
  router.put(
    '/:id',
    requirePermission('lessons.update'),
    uploadLesson.single('file'),
    lessonController.updateLesson
  );

  /**
   * DELETE /api/v1/admin/lessons/:id
   * Delete lesson
   * 
   * Permission: lessons.delete
   * Accessible by: Admin, Department Chair
   */
  router.delete('/:id', requirePermission('lessons.delete'), lessonController.deleteLesson);

  return router;
}
