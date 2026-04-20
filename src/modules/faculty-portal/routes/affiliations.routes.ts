/**
 * Faculty Portal - Affiliations Routes
 * Route definitions for faculty affiliations endpoints
 * 
 * Provides endpoints for faculty members to view and update their own affiliations.
 * All routes require authentication and RBAC permission checks.
 * 
 * Requirements: Phase 10 - Affiliations Management
 */

import { Router } from 'express';
import { AffiliationsController } from '../controllers/affiliations.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create affiliations routes
 * 
 * @param affiliationsController - Affiliations controller instance
 * @returns Express router with affiliations routes
 */
export function createAffiliationsRoutes(affiliationsController: AffiliationsController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/faculty/profile/affiliations
   * Get affiliations for the authenticated faculty member
   * 
   * Permission: faculty.profile.read
   * 
   * Extracts faculty_id from the authenticated user's JWT token.
   * Returns all affiliations for the faculty member ordered by start_date descending.
   * Returns empty array if no affiliations found.
   * 
   * Response:
   * - 200: Affiliations retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a faculty member)
   * - 404: Not Found (faculty not found)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "organizationName": "IEEE",
   *       "type": "professional",
   *       "role": "Member",
   *       "joinDate": "2020-01-15",
   *       "endDate": null,
   *       "isActive": true
   *     }
   *   ]
   * }
   */
  router.get(
    '/',
    requirePermission('faculty.profile.read'),
    affiliationsController.getAffiliations
  );

  /**
   * PUT /api/faculty/profile/affiliations
   * Update affiliations for the authenticated faculty member
   * 
   * Permission: faculty.profile.update
   * 
   * Extracts faculty_id from the authenticated user's JWT token.
   * Replaces all existing affiliations with the provided affiliations array.
   * Uses transaction-based replace strategy for atomic updates.
   * Creates audit log entry for the update.
   * 
   * Request Body:
   * {
   *   "affiliations": [
   *     {
   *       "organizationName": "IEEE",
   *       "type": "professional",
   *       "role": "Member",
   *       "joinDate": "2020-01-15",
   *       "endDate": null,
   *       "isActive": true
   *     }
   *   ]
   * }
   * 
   * Validation Rules:
   * - organizationName: 2-200 characters, required
   * - type: one of [professional, academic, community, other], required
   * - role: 2-100 characters, required
   * - joinDate: YYYY-MM-DD format, not in future, required
   * - endDate: YYYY-MM-DD format, must be after joinDate, optional
   * - isActive: boolean, optional (defaults to true)
   * 
   * Response:
   * - 200: Affiliations updated successfully
   * - 400: Bad Request (validation failed)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a faculty member)
   * - 404: Not Found (faculty not found)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": [...updated affiliations...],
   *   "message": "Successfully updated 3 affiliation(s)"
   * }
   */
  router.put(
    '/',
    requirePermission('faculty.profile.update'),
    affiliationsController.updateAffiliations
  );

  return router;
}
