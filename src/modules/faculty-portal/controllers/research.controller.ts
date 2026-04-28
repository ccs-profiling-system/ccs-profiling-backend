/**
 * Faculty Portal - Research Controller
 * HTTP request/response handling for research project management operations
 * 
 * Handles research project creation, updates, and retrieval for faculty members.
 * All operations validate faculty association with research projects to ensure
 * faculty can only manage their own research.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { ResearchService } from '../services/research.service';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';
import { FacultyUserContext } from '../utils/facultyScope';
import { createResearchSchema, updateResearchSchema } from '../schemas/research.schema';
import { ValidationError } from '../../../shared/errors';
import { z } from 'zod';

/**
 * Validation schema for research ID route parameter
 */
const researchIdParamSchema = z.object({
  id: z.string().uuid('Invalid research ID format'),
});

/**
 * Validation schema for pagination and filter query parameters
 */
const listResearchQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().optional(),
});

export class ResearchController {
  constructor(private researchService: ResearchService) {}

  /**
   * GET /api/faculty/research
   * List research projects with pagination and filtering
   * 
   * Retrieves research projects where the authenticated faculty member is the
   * primary researcher or adviser. Supports pagination and filtering by status.
   * 
   * Query Parameters:
   * - page (optional): Page number (default: 1)
   * - limit (optional): Items per page (default: 10, max: 100)
   * - status (optional): Filter by research status
   * 
   * Returns:
   * - 200: Paginated list of research projects with metadata
   * - 400: If invalid query parameters provided
   * 
   */
  listResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const queryValidation = listResearchQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters', queryValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      const { page, limit, status } = queryValidation.data;

      // Build filters
      const filters = status ? { status } : undefined;

      // Retrieve research projects
      const result = await this.researchService.listResearchByFaculty(
        facultyId,
        { page, limit },
        filters
      );

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/faculty/research/:id
   * Get research project details by ID
   * 
   * Retrieves a single research project with full details including student
   * researchers and advisers. Validates that the authenticated faculty member
   * is associated with the research project.
   * 
   * Route Parameters:
   * - id (required): UUID of the research project
   * 
   * Returns:
   * - 200: Research project details
   * - 400: If invalid research ID format
   * - 403: If faculty is not associated with the research project
   * - 404: If research project doesn't exist
   * 
   */
  getResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate research ID parameter
      const paramValidation = researchIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid research ID', paramValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      const { id } = paramValidation.data;

      // Retrieve research project
      // Service will validate faculty association and throw ResearchAccessDeniedError (403) if not associated
      const research = await this.researchService.getResearchById(id, facultyId);

      res.json({
        success: true,
        data: research,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/faculty/research
   * Create a new research project
   * 
   * Creates a new research project with the authenticated faculty member as the
   * primary adviser. Sets initial status to 'draft'. Validates start_date is not
   * in the past and end_date is after start_date if provided.
   * 
   * Request Body:
   * - title (required): Research project title
   * - description (required): Research project description
   * - research_type (required): Type of research (e.g., 'thesis', 'capstone', 'publication')
   * - start_date (required): Project start date (YYYY-MM-DD format)
   * - end_date (optional): Project end date (YYYY-MM-DD format)
   * - funding_source (optional): Source of funding
   * - budget (optional): Project budget
   * - student_researchers (optional): Array of student UUIDs
   * 
   * Returns:
   * - 200: Created research project details
   * - 400: If validation fails or dates are invalid
   * 
   */
  createResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const bodyValidation = createResearchSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);
      const userId = (authenticatedReq.user as FacultyUserContext).userId;

      const data = bodyValidation.data;

      // Create research project
      // Service will set status to 'draft' and add faculty as primary adviser
      const research = await this.researchService.createResearch(data, facultyId, userId);

      res.json({
        success: true,
        data: research,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/faculty/research/:id
   * Update an existing research project
   * 
   * Updates research project fields with validation. Validates faculty association,
   * status transitions, and prevents updates to approved/rejected research.
   * 
   * Route Parameters:
   * - id (required): UUID of the research project
   * 
   * Request Body:
   * - title (optional): Research project title
   * - description (optional): Research project description
   * - status (optional): Research status (draft, pending_approval, approved, rejected)
   * - end_date (optional): Project end date (YYYY-MM-DD format)
   * - funding_source (optional): Source of funding
   * - budget (optional): Project budget
   * - student_researchers (optional): Array of student UUIDs
   * 
   * Returns:
   * - 200: Updated research project details
   * - 400: If validation fails, invalid state transition, or attempting to update approved/rejected research
   * - 403: If faculty is not associated with the research project
   * - 404: If research project doesn't exist
   * 
   */
  updateResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate research ID parameter
      const paramValidation = researchIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid research ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateResearchSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);
      const userId = (authenticatedReq.user as FacultyUserContext).userId;

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      // Update research project
      // Service will validate faculty association, status transitions, and prevent updates to approved/rejected research
      // Throws ResearchAccessDeniedError (403) if faculty not associated
      // Throws InvalidResearchStatusError (400) if attempting to update approved/rejected research
      // Throws InvalidStatusTransitionError (400) if invalid status transition
      const research = await this.researchService.updateResearch(id, data, facultyId, userId);

      res.json({
        success: true,
        data: research,
      });
    } catch (error) {
      next(error);
    }
  };
}
