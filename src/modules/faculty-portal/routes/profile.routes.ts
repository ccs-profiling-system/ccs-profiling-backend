/**
 * Faculty Portal - Profile Routes
 * Route definitions for faculty profile endpoints
 * 
 * Provides endpoints for faculty members to view and update their own profiles.
 * All routes require authentication and RBAC permission checks.
 * 
 * Requirements: 3.1, 3.5, 14.1, 16.1, 16.3
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
   * GET /api/faculty/profile
   * Get faculty profile for authenticated user
   * 
   * Permission: faculty.profile.read
   * 
   * Extracts faculty_id from JWT token and returns the profile.
   * No facultyId parameter needed in URL - determined from authentication.
   * 
   * Response:
   * - 200: Profile retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a faculty member)
   * - 404: Not Found (faculty profile not found)
   * 
   * Requirements: 3.1, 3.2, 3.4, 14.1, 16.1, 16.3
   */
  router.get(
    '/',
    requirePermission('faculty.profile.read'),
    profileController.getProfile
  );

  /**
   * PUT /api/faculty/profile
   * Update faculty profile for authenticated user
   * 
   * Permission: faculty.profile.update
   * 
   * Extracts faculty_id from JWT token and updates the profile.
   * No facultyId parameter needed in URL - determined from authentication.
   * Validates request body using Zod schema for email and phone formats.
   * 
   * Request Body (all fields optional):
   * - phone: string (phone number format)
   * - email: string (email format)
   * - office_location: string
   * - consultation_hours: string
   * - specialization: string
   * - bio: string
   * 
   * Response:
   * - 200: Profile updated successfully
   * - 400: Bad Request (validation failed)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a faculty member)
   * - 404: Not Found (faculty profile not found)
   * 
   * Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 14.1, 16.1, 16.3
   */
  router.put(
    '/',
    requirePermission('faculty.profile.update'),
    profileController.updateProfile
  );

  return router;
}
