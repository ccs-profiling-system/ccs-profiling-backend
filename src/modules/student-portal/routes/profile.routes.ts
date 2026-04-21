/**
 * Student Portal - Profile Routes
 * Route definitions for student profile endpoints
 * 
 * Provides endpoints for students to view and update their own profiles.
 * All routes require authentication and RBAC permission checks.
 * 
 * Requirements: 1.6, 1.7, 27.1, 27.2, 27.3, 27.4, 27.5
 */

import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create profile routes
 * 
 * @param profileController - Profile controller instance
 * @returns Express router with profile routes
 */
export function createProfileRoutes(profileController: ProfileController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/student/profile
   * Get student profile for authenticated user
   * 
   * Permission: student.profile.read
   * 
   * Extracts student_id from JWT token and returns the profile.
   * No studentId parameter needed in URL - determined from authentication.
   * 
   * Response:
   * - 200: Profile retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (student profile not found)
   * 
   * Requirements: 1.1, 1.6, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/',
    requirePermission('student.profile.read'),
    profileController.getProfile
  );

  /**
   * PUT /api/student/profile
   * Update student profile for authenticated user
   * 
   * Permission: student.profile.update
   * 
   * Extracts student_id from JWT token and updates the profile.
   * No studentId parameter needed in URL - determined from authentication.
   * Validates request body using Zod schema for email and phone formats.
   * 
   * Request Body (all fields optional):
   * - email: string (email format)
   * - phone: string (phone number format)
   * 
   * Response:
   * - 200: Profile updated successfully
   * - 400: Bad Request (validation failed)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (student profile not found)
   * 
   * Requirements: 1.2, 1.3, 1.4, 1.7, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.put(
    '/',
    requirePermission('student.profile.update'),
    profileController.updateProfile
  );

  return router;
}
