/**
 * Research Controller
 * 
 * HTTP request/response handling for research project management in the department chair portal.
 * Handles pagination, filtering, approval/rejection workflows, and department-scoped access.
 * 
 * Requirements: 7.1, 7.4, 7.7, 7.11, 9.1, 9.2
 */

import { Request, Response, NextFunction } from 'express';
import { ResearchService } from '../services/research.service';
import { extractDepartmentFromRequest } from '../utils/departmentScope';
import { NotFoundError, ValidationError } from '../../../shared/errors';
import { approvalSchema, rejectionSchema } from '../schemas/common.schemas';

export class ResearchController {
  constructor(private researchService: ResearchService) {}

  /**
   * GET /api/chair/research
   * 
   * List research projects with pagination and filtering.
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - status: Filter by research status (optional)
   * - faculty_id: Filter by faculty advisor ID (optional)
   * - search: Search by title or description (optional)
   * 
   * @param req - Express request with query parameters
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with paginated research list
   * @throws NotFoundError if user has no department affiliation
   * 
   * Requirements: 7.1, 7.2, 7.3
   */
  listResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Parse and validate query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const status = req.query.status as string | undefined;
      const faculty_id = req.query.faculty_id as string | undefined;
      const search = req.query.search as string | undefined;

      // Validate pagination parameters
      if (page < 1) {
        throw new ValidationError('Page must be at least 1');
      }
      if (limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      // Get research projects from service
      const result = await this.researchService.listResearch(departmentInfo.departmentId, {
        page,
        limit,
        status,
        faculty_id,
        search,
      });

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
   * GET /api/chair/research/:id
   * 
   * Get research project details by ID with department validation.
   * 
   * @param req - Express request with research ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with research project details
   * @returns HTTP 404 if research not found or outside department scope
   * @throws NotFoundError if user has no department affiliation
   * 
   * Requirements: 7.4, 7.5, 7.6
   */
  getResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Get research ID from route parameter
      const researchId = req.params.id;

      // Get research from service
      const research = await this.researchService.getResearchById(researchId, departmentInfo.departmentId);

      if (!research) {
        throw new NotFoundError('Research project not found');
      }

      res.json({
        success: true,
        data: research,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/chair/research/:id/approve
   * 
   * Approve a research project.
   * 
   * Request Body:
   * - approver_notes: Optional notes from the approver
   * 
   * @param req - Express request with research ID and approval data
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with updated research details
   * @returns HTTP 400 if research is not in valid state for approval
   * @returns HTTP 404 if research not found or outside department scope
   * @throws NotFoundError if user has no department affiliation
   * 
   * Requirements: 7.7, 7.8, 7.9, 7.10
   */
  approveResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Get research ID from route parameter
      const researchId = req.params.id;

      // Validate request body
      const validationResult = approvalSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const approvalData = validationResult.data;

      // Get authenticated user ID
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }

      // Approve research
      try {
        const research = await this.researchService.approveResearch(
          researchId,
          departmentInfo.departmentId,
          approvalData,
          userId
        );

        if (!research) {
          throw new NotFoundError('Research project not found');
        }

        res.json({
          success: true,
          data: research,
          message: 'Research project approved successfully',
        });
      } catch (error) {
        // Check if error is a workflow validation error
        if (error instanceof Error && error.message.includes('Cannot approve')) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/chair/research/:id/reject
   * 
   * Reject a research project.
   * 
   * Request Body:
   * - rejection_reason: Required reason for rejection (10-1000 characters)
   * 
   * @param req - Express request with research ID and rejection data
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with updated research details
   * @returns HTTP 400 if research is not in valid state for rejection or missing rejection_reason
   * @returns HTTP 404 if research not found or outside department scope
   * @throws NotFoundError if user has no department affiliation
   * 
   * Requirements: 7.11, 7.12, 7.13, 7.14
   */
  rejectResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Get research ID from route parameter
      const researchId = req.params.id;

      // Validate request body
      const validationResult = rejectionSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const rejectionData = validationResult.data;

      // Get authenticated user ID
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }

      // Reject research
      try {
        const research = await this.researchService.rejectResearch(
          researchId,
          departmentInfo.departmentId,
          rejectionData,
          userId
        );

        if (!research) {
          throw new NotFoundError('Research project not found');
        }

        res.json({
          success: true,
          data: research,
          message: 'Research project rejected successfully',
        });
      } catch (error) {
        // Check if error is a workflow validation error
        if (error instanceof Error && error.message.includes('Cannot reject')) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };
}
