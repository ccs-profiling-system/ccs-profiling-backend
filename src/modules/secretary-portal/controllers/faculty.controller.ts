/**
 * Faculty Controller
 * 
 * HTTP request/response handling for secretary portal faculty operations.
 * Provides CRUD operations for faculty and teaching load retrieval.
 * 
 * Requirements: 4.1-4.6, 4.20-4.23, 15.1, 15.4
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getTeachingLoad,
} from '../services/faculty.service';
import {
  createFacultySchema,
  updateFacultySchema,
  facultyFilterSchema,
} from '../schemas/faculty.schema';
import { paginationSchema, idParamSchema } from '../schemas/common.schemas';

/**
 * GET /api/secretary/faculty
 * 
 * Retrieve all faculty with pagination and filtering.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - department: Filter by department
 * - position: Filter by position
 * - status: Filter by status
 * - search: Search by name or faculty_id
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with paginated faculty list on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if faculty retrieval fails
 * 
 * Requirements: 4.1, 4.14-4.16, 4.20-4.23, 15.1
 */
export async function getAllFacultyController(
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
    const filterResult = facultyFilterSchema.safeParse(req.query);
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
    const { department, position, status, search } = filterResult.data;

    // Get faculty from service
    const result = await getAllFaculty(
      { page, limit },
      { department, position, status },
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
 * GET /api/secretary/faculty/:id
 * 
 * Retrieve a faculty member by ID.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with faculty data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when faculty not found with entity type
 * @throws Error if faculty retrieval fails
 * 
 * Requirements: 4.2, 4.20-4.23, 15.4
 */
export async function getFacultyByIdController(
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

    // Get faculty from service
    const facultyMember = await getFacultyById(id);

    if (!facultyMember) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Faculty not found',
          entity_type: 'faculty',
        },
      });
      return;
    }

    // Return HTTP 200 with faculty data
    res.status(200).json({
      success: true,
      data: facultyMember,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/secretary/faculty
 * 
 * Create a new faculty member.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 201 for successful creation
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if faculty creation fails
 * 
 * Requirements: 4.3, 4.11-4.13, 4.20-4.23, 15.1
 */
export async function createFacultyController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const bodyResult = createFacultySchema.safeParse(req.body);
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

    // Create faculty via service
    const facultyMember = await createFaculty(
      bodyResult.data as {
        faculty_id: string;
        first_name: string;
        last_name: string;
        middle_name?: string;
        email: string;
        phone?: string;
        department: string;
        position?: string;
        specialization?: string;
        office_location?: string;
        consultation_hours?: string;
        bio?: string;
        status?: string;
        user_id?: string;
      },
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 201 with created faculty
    res.status(201).json({
      success: true,
      data: facultyMember,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Faculty ID already exists') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: [
            {
              field: 'faculty_id',
              message: 'Faculty ID already exists',
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
 * PUT /api/secretary/faculty/:id
 * 
 * Update an existing faculty member.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with updated faculty data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when faculty not found with entity type
 * @throws Error if faculty update fails
 * 
 * Requirements: 4.4, 4.11-4.13, 4.20-4.23, 15.4
 */
export async function updateFacultyController(
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
    const bodyResult = updateFacultySchema.safeParse(req.body);
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

    // Update faculty via service
    const facultyMember = await updateFaculty(
      id,
      bodyResult.data,
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 200 with updated faculty
    res.status(200).json({
      success: true,
      data: facultyMember,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Faculty not found',
            entity_type: 'faculty',
          },
        });
        return;
      }

      if (error.message === 'Faculty ID already exists') {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: [
              {
                field: 'faculty_id',
                message: 'Faculty ID already exists',
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
 * DELETE /api/secretary/faculty/:id
 * 
 * Delete a faculty member (soft delete).
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with deleted faculty data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when faculty not found with entity type
 * @throws Error if faculty deletion fails
 * 
 * Requirements: 4.5, 4.20-4.23, 15.4
 */
export async function deleteFacultyController(
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

    // Delete faculty via service
    const facultyMember = await deleteFaculty(id, userId, ipAddress, userAgent);

    // Return HTTP 200 with deleted faculty
    res.status(200).json({
      success: true,
      data: facultyMember,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Faculty not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Faculty not found',
          entity_type: 'faculty',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/faculty/:id/teaching-load
 * 
 * Retrieve teaching load for a faculty member.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with teaching load list on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when faculty not found with entity type
 * @throws Error if teaching load retrieval fails
 * 
 * Requirements: 4.6, 4.20-4.23, 15.4
 */
export async function getTeachingLoadController(
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

    // Get teaching load from service
    const teachingLoad = await getTeachingLoad(id);

    // Return HTTP 200 with teaching load
    res.status(200).json({
      success: true,
      data: teachingLoad,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Faculty not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Faculty not found',
          entity_type: 'faculty',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}
