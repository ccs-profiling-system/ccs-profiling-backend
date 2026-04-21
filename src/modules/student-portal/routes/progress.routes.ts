/**
 * Student Portal - Progress Routes
 * Route definitions for academic progress endpoints
 * 
 * Provides endpoint for students to view their academic progress.
 * All routes require authentication and RBAC permission checks.
 * 
 * Requirements: 3.6, 27.1, 27.2, 27.3, 27.4, 27.5
 */

import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create progress routes
 * 
 * @param progressController - Progress controller instance
 * @returns Express router with progress routes
 */
export function createProgressRoutes(progressController: ProgressController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/student/progress
   * Get academic progress for authenticated student
   * 
   * Permission: student.progress.read
   * 
   * Extracts student_id from JWT token and returns academic progress data:
   * - Total credits earned (sum of passed courses)
   * - Total credits required for degree
   * - Current year level
   * - Academic standing (Good Standing: GPA >= 2.0, Probation: GPA < 2.0)
   * - Completed courses grouped by academic year and semester
   * 
   * Response:
   * - 200: Academic progress retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 500: Internal Server Error
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/',
    requirePermission('student.progress.read'),
    progressController.getProgress
  );

  return router;
}
