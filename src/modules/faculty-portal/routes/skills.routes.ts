/**
 * Faculty Portal - Skills Routes
 * Route definitions for faculty skills endpoints
 * 
 * Provides endpoints for faculty members to view and update their own skills.
 * All routes require authentication and RBAC permission checks.
 * 
 */

import { Router } from 'express';
import { SkillsController } from '../controllers/skills.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create skills routes
 * 
 * @param skillsController - Skills controller instance
 * @returns Express router with skills routes
 */
export function createSkillsRoutes(skillsController: SkillsController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/faculty/profile/skills
   * Get skills for the authenticated faculty member
   * 
   * Permission: faculty.profile.read
   * 
   * Extracts faculty_id from the authenticated user's JWT token.
   * Returns all skills for the faculty member ordered by category, skillName.
   * Returns empty array if no skills found.
   * 
   * Response:
   * - 200: Skills retrieved successfully
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
   *       "skillName": "JavaScript",
   *       "category": "technical",
   *       "proficiencyLevel": "expert",
   *       "yearsOfExperience": 10
   *     }
   *   ]
   * }
   */
  router.get(
    '/',
    requirePermission('faculty.profile.read'),
    skillsController.getSkills
  );

  /**
   * PUT /api/faculty/profile/skills
   * Update skills for the authenticated faculty member
   * 
   * Permission: faculty.profile.update
   * 
   * Extracts faculty_id from the authenticated user's JWT token.
   * Replaces all existing skills with the provided skills array.
   * Uses transaction-based replace strategy for atomic updates.
   * Creates audit log entry for the update.
   * 
   * Request Body:
   * {
   *   "skills": [
   *     {
   *       "skillName": "JavaScript",
   *       "category": "technical",
   *       "proficiencyLevel": "expert",
   *       "yearsOfExperience": 10
   *     }
   *   ]
   * }
   * 
   * Validation Rules:
   * - skillName: 2-200 characters, required
   * - category: one of [technical, soft, language, sports, other], required
   * - proficiencyLevel: one of [beginner, intermediate, advanced, expert], required
   * - yearsOfExperience: integer 0-50, optional
   * 
   * Response:
   * - 200: Skills updated successfully
   * - 400: Bad Request (validation failed)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a faculty member)
   * - 404: Not Found (faculty not found)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": [...updated skills...],
   *   "message": "Successfully updated 3 skill(s)"
   * }
   */
  router.put(
    '/',
    requirePermission('faculty.profile.update'),
    skillsController.updateSkills
  );

  return router;
}
