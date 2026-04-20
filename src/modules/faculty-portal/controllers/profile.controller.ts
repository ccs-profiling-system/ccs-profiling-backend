/**
 * Faculty Portal - Profile Controller
 * HTTP request/response handling for faculty profile operations
 * 
 * Handles faculty profile viewing and updates with faculty-scoped validation.
 * Ensures faculty members can only access and update their own profiles.
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.10, 3.11
 */

import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { ValidationError } from '../../../shared/errors';
import { updateProfileSchema } from '../schemas/profile.schema';
import { extractAndValidateFacultyId } from '../utils/facultyScope';
import { z } from 'zod';

/**
 * Validation schema for facultyId route parameter
 */
const facultyIdParamSchema = z.object({
  facultyId: z.string().min(1, 'Faculty ID is required'),
});

export class ProfileController {
  constructor(private profileService: ProfileService) {}

  /**
   * GET /api/admin/faculty/:facultyId/profile
   * Get faculty profile by ID
   * 
   * Validates that the authenticated user's faculty_id matches the requested facultyId.
   * Returns HTTP 403 if attempting to access another faculty's profile.
   * 
   * Requirements: 3.1, 3.2, 3.4
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate facultyId parameter
      const paramValidation = facultyIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid faculty ID', paramValidation.error.errors);
      }

      // Extract and validate faculty_id from authenticated user
      // This will throw FacultyAccessError (403) if facultyId doesn't match user's facultyId
      const facultyId = extractAndValidateFacultyId(req, 'facultyId');

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
   * PUT /api/admin/faculty/:facultyId/profile
   * Update faculty profile by ID
   * 
   * Validates that the authenticated user's faculty_id matches the requested facultyId.
   * Returns HTTP 403 if attempting to update another faculty's profile.
   * Validates request body using Zod schema for email and phone formats.
   * 
   * Requirements: 3.5, 3.6, 3.10, 3.11
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate facultyId parameter
      const paramValidation = facultyIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid faculty ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateProfileSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      // Extract and validate faculty_id from authenticated user
      // This will throw FacultyAccessError (403) if facultyId doesn't match user's facultyId
      const facultyId = extractAndValidateFacultyId(req, 'facultyId');

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
