/**
 * Student Portal - Profile Controller
 * HTTP request/response handling for student profile operations
 * 
 * Handles student profile viewing and updates with student-scoped validation.
 * Ensures students can only access and update their own profiles.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { ValidationError } from '../../../shared/errors';
import { updateProfileSchema } from '../schemas/profile.schema';
import { extractStudentId } from '../utils/studentScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class ProfileController {
  constructor(private profileService: ProfileService) {}

  /**
   * GET /api/student/profile
   * Get student profile for authenticated user
   * 
   * Extracts student_id from JWT token and returns the profile.
   * 
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      // This will throw StudentAccessError (403) if user is not student
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Retrieve profile
      const profile = await this.profileService.getProfileById(studentId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/student/profile
   * Update student profile for authenticated user
   * 
   * Extracts student_id from JWT token and updates the profile.
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

      // Extract student_id from authenticated user (from JWT token)
      // This will throw StudentAccessError (403) if user is not student
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      const data = bodyValidation.data;

      // Update profile
      const updatedProfile = await this.profileService.updateProfile(studentId, data);

      res.json({
        success: true,
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  };
}
