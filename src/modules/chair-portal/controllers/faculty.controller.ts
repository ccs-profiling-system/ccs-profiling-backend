/**
 * Faculty Controller
 * 
 * HTTP request/response handling for faculty management operations.
 * Extracts department ID from authenticated user and delegates to FacultyService.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { FacultyService } from '../services/faculty.service';
import { extractDepartmentFromRequest } from '../utils/departmentScope';
import { NotFoundError } from '../../../shared/errors';

export class FacultyController {
  constructor(private facultyService: FacultyService) {}

  /**
   * GET /api/chair/faculty
   * 
   * List faculty members with pagination and filtering.
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
   * @throws NotFoundError if user has no department affiliation
   * 
   */
  listFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      // Get paginated faculty list
      const result = await this.facultyService.listFaculty(departmentInfo.departmentId, {
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
   * Get individual faculty member details.
   * 
   * @param req - Express request with faculty ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with faculty details
   * @throws NotFoundError if faculty not found or outside department scope
   * 
   */
  getFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);
      const facultyId = req.params.id;

      // Get faculty details
      const facultyMember = await this.facultyService.getFacultyById(facultyId, departmentInfo.departmentId);

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
   * Get faculty teaching load with current semester schedules.
   * 
   * @param req - Express request with faculty ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with teaching load data
   * @throws NotFoundError if faculty not found or outside department scope
   * 
   */
  getTeachingLoad = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);
      const facultyId = req.params.id;

      // Get teaching load
      const teachingLoad = await this.facultyService.getFacultyTeachingLoad(facultyId, departmentInfo.departmentId);

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
   * Get faculty statistics including students taught, courses, and research count.
   * 
   * @param req - Express request with faculty ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with faculty statistics
   * @throws NotFoundError if faculty not found or outside department scope
   * 
   */
  getFacultyStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);
      const facultyId = req.params.id;

      // Get faculty stats
      const stats = await this.facultyService.getFacultyStats(facultyId, departmentInfo.departmentId);

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
