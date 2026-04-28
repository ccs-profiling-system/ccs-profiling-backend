/**
 * Faculty Controller
 * 
 * HTTP request/response handling for faculty management operations.
 * Extracts department ID from authenticated user and delegates to FacultyService.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { FacultyService } from '../services/faculty.service';
import { NotFoundError } from '../../../shared/errors';

export class FacultyController {
  constructor(private facultyService: FacultyService) {}

  /**
   * GET /api/chair/faculty
   * 
   * List faculty members with pagination and filtering across all programs (college-wide).
   * 
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - status: Filter by status (active, inactive)
   * - search: Search by name or email
   * 
   * @param req - Express request with query parameters
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with paginated faculty list
   * 
   */
  listFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      // Get paginated faculty list (college-wide scope)
      const result = await this.facultyService.listFaculty('', {
        page,
        limit,
        status,
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
   * GET /api/chair/faculty/:id
   * 
   * Get individual faculty member details (college-wide access).
   * 
   * @param req - Express request with faculty ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with faculty details
   * @throws NotFoundError if faculty not found
   * 
   */
  getFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facultyId = req.params.id;

      // Get faculty details (college-wide scope)
      const facultyMember = await this.facultyService.getFacultyById(facultyId, '');

      if (!facultyMember) {
        throw new NotFoundError('Faculty member not found');
      }

      res.json({
        success: true,
        data: facultyMember,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/chair/faculty/:id/teaching-load
   * 
   * Get faculty teaching load with current semester schedules (college-wide access).
   * 
   * @param req - Express request with faculty ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with teaching load data
   * @throws NotFoundError if faculty not found
   * 
   */
  getTeachingLoad = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facultyId = req.params.id;

      // Get teaching load (college-wide scope)
      const teachingLoad = await this.facultyService.getFacultyTeachingLoad(facultyId, '');

      if (!teachingLoad) {
        throw new NotFoundError('Faculty member not found');
      }

      res.json({
        success: true,
        data: teachingLoad,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/chair/faculty/:id/stats
   * 
   * Get faculty statistics including students taught, courses, and research count (college-wide access).
   * 
   * @param req - Express request with faculty ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with faculty statistics
   * @throws NotFoundError if faculty not found
   * 
   */
  getFacultyStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facultyId = req.params.id;

      // Get faculty stats (college-wide scope)
      const stats = await this.facultyService.getFacultyStats(facultyId, '');

      if (!stats) {
        throw new NotFoundError('Faculty member not found');
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
