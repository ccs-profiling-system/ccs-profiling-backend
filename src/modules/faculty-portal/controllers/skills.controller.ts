/**
 * Faculty Portal - Skills Controller
 * HTTP request/response handling for faculty skills operations
 * 
 * Handles faculty skills viewing and updates with faculty-scoped validation.
 * Ensures faculty members can only access and update their own skills.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { SkillsService } from '../services/skills.service';
import { ValidationError } from '../../../shared/errors';
import { updateSkillsSchema } from '../schemas/skills.schema';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class SkillsController {
  constructor(private skillsService: SkillsService) {}

  /**
   * GET /api/faculty/profile/skills
   * Get skills for the authenticated faculty member
   * 
   * Extracts faculty_id from the authenticated user's JWT token.
   * Returns all skills for the faculty member ordered by category, skillName.
   * Returns empty array if no skills found.
   * 
   * - Extract faculty_id from authenticated user
   * - Return appropriate HTTP status codes (200, 403)
   */
  getSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user);

      // Retrieve skills
      const skills = await this.skillsService.getSkillsByFaculty(facultyId);

      res.json({
        success: true,
        data: skills,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/faculty/profile/skills
   * Update skills for the authenticated faculty member
   * 
   * Extracts faculty_id from the authenticated user's JWT token.
   * Validates request body using Zod schema.
   * Replaces all existing skills with the provided skills array.
   * Uses transaction-based replace strategy for atomic updates.
   * Creates audit log entry for the update.
   * 
   * - Extract faculty_id from authenticated user
   * - Validate request body using Zod schema
   * - Return HTTP 403 if attempting to update another faculty's skills
   * - Return appropriate HTTP status codes (200, 400, 403)
   */
  updateSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user);
      const userId = authenticatedReq.user?.userId;

      if (!userId) {
        throw new ValidationError('User ID not found in authentication context');
      }

      // Validate request body
      const bodyValidation = updateSkillsSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { skills } = bodyValidation.data;

      // Update skills
      const result = await this.skillsService.updateSkills(facultyId, skills, userId);

      res.json({
        success: true,
        data: result.skills,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}
