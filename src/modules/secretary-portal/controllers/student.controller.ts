/**
 * Student Controller
 * 
 * HTTP request/response handling for secretary portal student operations.
 * Provides CRUD operations for students and academic history retrieval.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getAcademicHistory,
} from '../services/student.service';
import {
  createStudentSchema,
  updateStudentSchema,
  studentFilterSchema,
} from '../schemas/student.schema';
import { paginationSchema, idParamSchema } from '../schemas/common.schemas';

/**
 * GET /api/secretary/students
 * 
 * Retrieve all students with pagination and filtering.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - year_level: Filter by year level (1-6)
 * - program: Filter by program
 * - status: Filter by status
 * - search: Search by name or student_id
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with paginated student list on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if student retrieval fails
 * 
 */
export async function getAllStudentsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate pagination parameters
    const paginationResult = paginationSchema.safeParse(req.query);
    if (!paginationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paginationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Validate filter parameters
    const filterResult = studentFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: filterResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { page, limit } = paginationResult.data;
    const { year_level, program, status, search } = filterResult.data;

    // Get students from service
    const result = await getAllStudents(
      { page, limit },
      { year_level, program, status },
      search
    );

    // Return HTTP 200 with paginated data
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/students/:id
 * 
 * Retrieve a student by ID.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with student data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when student not found with entity type
 * @throws Error if student retrieval fails
 * 
 */
export async function getStudentByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Get student from service
    const student = await getStudentById(id);

    if (!student) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Student not found',
          entity_type: 'student',
        },
      });
      return;
    }

    // Return HTTP 200 with student data
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/secretary/students
 * 
 * Create a new student.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 201 for successful creation
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if student creation fails
 * 
 */
export async function createStudentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const bodyResult = createStudentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: bodyResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Create student via service
    const student = await createStudent(
      bodyResult.data as {
        first_name: string;
        last_name: string;
        middle_name?: string;
        email: string;
        phone?: string;
        date_of_birth?: string;
        address?: string;
        year_level?: number;
        program?: string;
        status?: string;
        user_id?: string;
      },
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 201 with created student
    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Student ID already exists') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: [
            {
              field: 'student_id',
              message: 'Student ID already exists',
            },
          ],
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * PUT /api/secretary/students/:id
 * 
 * Update an existing student.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with updated student data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when student not found with entity type
 * @throws Error if student update fails
 * 
 */
export async function updateStudentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Validate request body
    const bodyResult = updateStudentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: bodyResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Update student via service
    const student = await updateStudent(
      id,
      bodyResult.data,
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 200 with updated student
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Student not found') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Student not found',
            entity_type: 'student',
          },
        });
        return;
      }

      if (error.message === 'Student ID already exists') {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: [
              {
                field: 'student_id',
                message: 'Student ID already exists',
              },
            ],
          },
        });
        return;
      }
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * DELETE /api/secretary/students/:id
 * 
 * Delete a student (soft delete).
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with deleted student data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when student not found with entity type
 * @throws Error if student deletion fails
 * 
 */
export async function deleteStudentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Delete student via service
    const student = await deleteStudent(id, userId, ipAddress, userAgent);

    // Return HTTP 200 with deleted student
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Student not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Student not found',
          entity_type: 'student',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/students/:id/academic-history
 * 
 * Retrieve academic history for a student.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with academic history list on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when student not found with entity type
 * @throws Error if academic history retrieval fails
 * 
 */
export async function getAcademicHistoryController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Get academic history from service
    const history = await getAcademicHistory(id);

    // Return HTTP 200 with academic history
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Student not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Student not found',
          entity_type: 'student',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}
