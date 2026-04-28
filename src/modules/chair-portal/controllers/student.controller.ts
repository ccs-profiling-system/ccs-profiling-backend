/**
 * Student Controller
 * 
 * HTTP request/response handling for student management in the department chair portal.
 * Handles pagination, filtering, approval/rejection workflows, and department-scoped access.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { extractDepartmentFromRequest } from '../utils/departmentScope';
import { NotFoundError, ValidationError } from '../../../shared/errors';
import { approvalSchema, rejectionSchema } from '../schemas/common.schemas';

export class StudentController {
  constructor(private studentService: StudentService) {}

  /**
   * GET /api/chair/students
   * 
   * List students with pagination and filtering.
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - status: Filter by student status (optional)
   * - year_level: Filter by year level (optional)
   * - search: Search by name or email (optional)
   * 
   * @param req - Express request with query parameters
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with paginated student list
   * @throws NotFoundError if user has no department affiliation
   * 
   */
  listStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Parse and validate query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const status = req.query.status as string | undefined;
      const year_level = req.query.year_level ? parseInt(req.query.year_level as string) : undefined;
      const search = req.query.search as string | undefined;

      // Validate pagination parameters
      if (page < 1) {
        throw new ValidationError('Page must be at least 1');
      }
      if (limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      // Get students from service
      const result = await this.studentService.listStudents(departmentInfo.departmentId, {
        page,
        limit,
        status,
        year_level,
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
   * GET /api/chair/students/:id
   * 
   * Get student details by ID with department validation.
   * 
   * @param req - Express request with student ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with student details
   * @returns HTTP 404 if student not found or outside department scope
   * @throws NotFoundError if user has no department affiliation
   * 
   */
  getStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Get student ID from route parameter
      const studentId = req.params.id;

      // Get student from service
      const student = await this.studentService.getStudentById(studentId, departmentInfo.departmentId);

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/chair/students/:id/approve
   * 
   * Approve a student.
   * 
   * Request Body:
   * - approver_notes: Optional notes from the approver
   * 
   * @param req - Express request with student ID and approval data
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with updated student details
   * @returns HTTP 400 if student is not in valid state for approval
   * @returns HTTP 404 if student not found or outside department scope
   * @throws NotFoundError if user has no department affiliation
   * 
   */
  approveStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Get student ID from route parameter
      const studentId = req.params.id;

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

      // Approve student
      try {
        const student = await this.studentService.approveStudent(
          studentId,
          departmentInfo.departmentId,
          approvalData,
          userId
        );

        if (!student) {
          throw new NotFoundError('Student not found');
        }

        res.json({
          success: true,
          data: student,
          message: 'Student approved successfully',
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
   * POST /api/chair/students/:id/reject
   * 
   * Reject a student.
   * 
   * Request Body:
   * - rejection_reason: Required reason for rejection (10-1000 characters)
   * 
   * @param req - Express request with student ID and rejection data
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with updated student details
   * @returns HTTP 400 if student is not in valid state for rejection or missing rejection_reason
   * @returns HTTP 404 if student not found or outside department scope
   * @throws NotFoundError if user has no department affiliation
   * 
   */
  rejectStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Get student ID from route parameter
      const studentId = req.params.id;

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

      // Reject student
      try {
        const student = await this.studentService.rejectStudent(
          studentId,
          departmentInfo.departmentId,
          rejectionData,
          userId
        );

        if (!student) {
          throw new NotFoundError('Student not found');
        }

        res.json({
          success: true,
          data: student,
          message: 'Student rejected successfully',
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
