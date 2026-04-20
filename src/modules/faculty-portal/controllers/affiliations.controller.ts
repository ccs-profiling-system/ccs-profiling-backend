/**
 * Faculty Portal - Affiliations Controller
 * HTTP request/response handling for faculty affiliations operations
 * 
 * Handles faculty affiliations viewing and updates with faculty-scoped validation.
 * Ensures faculty members can only access and update their own affiliations.
 * 
 * Requirements: Phase 10 - Affiliations Management
 */

import { Request, Response, NextFunction } from 'express';
import { AffiliationsService } from '../services/affiliations.service';
import { ValidationError } from '../../../shared/errors';
import { updateAffiliationsSchema } from '../schemas/affiliations.schema';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class AffiliationsController {
  constructor(private affiliationsService: AffiliationsService) {}

  /**
   * GET /api/faculty/profile/affiliations
   * Get affiliations for the authenticated faculty member
   * 
   * Extracts faculty_id from the authenticated user's JWT token.
   * Returns all affiliations for the faculty member ordered by start_date descending.
   * Returns empty array if no affiliations found.
   * 
   * Requirements:
   * - Extract faculty_id from authenticated user
   * - Return appropriate HTTP status codes (200, 403)
   */
  getAffiliations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user);

      // Retrieve affiliations
      const affiliations = await this.affiliationsService.getAffiliationsByFaculty(facultyId);

      res.json({
        success: true,
        data: affiliations,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/faculty/profile/affiliations
   * Update affiliations for the authenticated faculty member
   * 
   * Extracts faculty_id from the authenticated user's JWT token.
   * Validates request body using Zod schema.
   * Replaces all existing affiliations with the provided affiliations array.
   * Uses transaction-based replace strategy for atomic updates.
   * Creates audit log entry for the update.
   * 
   * Requirements:
   * - Extract faculty_id from authenticated user
   * - Validate request body using Zod schema
   * - Return HTTP 403 if attempting to update another faculty's affiliations
   * - Return appropriate HTTP status codes (200, 400, 403)
   */
  updateAffiliations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user);
      const userId = authenticatedReq.user?.userId;

      if (!userId) {
        throw new ValidationError('User ID not found in authentication context');
      }

      // Validate request body
      const bodyValidation = updateAffiliationsSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { affiliations } = bodyValidation.data;

      // Update affiliations
      const result = await this.affiliationsService.updateAffiliations(facultyId, affiliations, userId);

      res.json({
        success: true,
        data: result.affiliations,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}
