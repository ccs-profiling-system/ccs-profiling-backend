/**
 * Faculty Portal - Profile Controller
 * HTTP request/response handling for faculty profile operations
 * 
 * Handles faculty profile viewing and updates with faculty-scoped validation.
 * Ensures faculty members can only access and update their own profiles.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { ValidationError } from '../../../shared/errors';
import { updateProfileSchema } from '../schemas/profile.schema';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class ProfileController {
  constructor(private profileService: ProfileService) {}

  /**
   * GET /api/faculty/profile
   * Get faculty profile for authenticated user
   * 
   * Extracts faculty_id from JWT token and returns the profile.
   * 
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract faculty_id from authenticated user (from JWT token)
      // This will throw FacultyAccessError (403) if user is not faculty
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user);

      // Retrieve profile
      const profile = await this.profileService.getProfileById(facultyId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/faculty/profile
   * Update faculty profile for authenticated user
   * 
   * Extracts faculty_id from JWT token and updates the profile.
   * Validates request body using Zod schema for email and phone formats.
   * 
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const bodyValidation = updateProfileSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      // Extract faculty_id from authenticated user (from JWT token)
      // This will throw FacultyAccessError (403) if user is not faculty
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user);

      const data = bodyValidation.data;

      // Update profile
      const updatedProfile = await this.profileService.updateProfile(facultyId, data);

      res.json({
        success: true,
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  };
}
