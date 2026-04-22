/**
 * Research Controller
 * 
 * HTTP request/response handling for secretary portal research operations.
 * Provides CRUD operations for research with approval workflow and file upload support.
 * 
 * Requirements: 8.1-8.10, 8.35-8.38, 15.1, 15.4, 15.6
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllResearch,
  getResearchById,
  createResearch,
  updateResearch,
  deleteResearch,
  submitResearch,
  uploadResearchFile,
  getResearchFiles,
  deleteResearchFile,
  getResearchAuthors,
} from '../services/research.service';
import {
  createResearchSchema,
  updateResearchSchema,
  researchFilterSchema,
} from '../schemas/research.schema';
import { paginationSchema, idParamSchema } from '../schemas/common.schemas';

/**
 * GET /api/secretary/research
 * 
 * Retrieve all research projects with pagination and filtering.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - research_type: Filter by research type
 * - status: Filter by approval status
 * - start_date: Filter by start date (YYYY-MM-DD)
 * - end_date: Filter by end date (YYYY-MM-DD)
 * - search: Search by title
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with paginated research list on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if research retrieval fails
 * 
 * Requirements: 8.1, 8.28-8.30, 8.35, 15.1
 */
export async function getAllResearchController(
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
    const filterResult = researchFilterSchema.safeParse(req.query);
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
    const { research_type, status, start_date, end_date, search } = filterResult.data;

    // Get research from service
    const result = await getAllResearch(
      { page, limit },
      { research_type, status, start_date, end_date },
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
 * GET /api/secretary/research/:id
 * 
 * Retrieve a research project by ID.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with research data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when research not found
 * @throws Error if research retrieval fails
 * 
 * Requirements: 8.2, 8.35, 15.4
 */
export async function getResearchByIdController(
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

    // Get research from service
    const research = await getResearchById(id);

    if (!research) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Research not found',
        },
      });
      return;
    }

    // Return HTTP 200 with research data
    res.status(200).json({
      success: true,
      data: research,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/secretary/research
 * 
 * Create a new research project.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 201 for successful creation
 * @returns HTTP 400 for validation errors or invalid state transitions
 * @throws Error if research creation fails
 * 
 * Requirements: 8.3, 8.15-8.19, 8.36, 15.1
 */
export async function createResearchController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const bodyResult = createResearchSchema.safeParse(req.body);
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

    // Create research via service
    const research = await createResearch(
      bodyResult.data,
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 201 with created research
    res.status(201).json({
      success: true,
      data: research,
    });
  } catch (error) {
    // Handle validation errors from service
    if (error instanceof Error && 
        (error.message.includes('Start date cannot be in the past') ||
         error.message.includes('Completion date must be after start date') ||
         error.message.includes('Invalid research type'))) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * PUT /api/secretary/research/:id
 * 
 * Update an existing research project.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with updated research data on success
 * @returns HTTP 400 for validation errors or invalid state transitions
 * @returns HTTP 404 when research not found
 * @returns HTTP 422 for business logic errors (e.g., cannot update approved research)
 * @throws Error if research update fails
 * 
 * Requirements: 8.4, 8.15-8.18, 8.21, 8.37, 15.4, 15.6
 */
export async function updateResearchController(
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
    const bodyResult = updateResearchSchema.safeParse(req.body);
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

    // Update research via service
    const research = await updateResearch(
      id,
      bodyResult.data,
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 200 with updated research
    res.status(200).json({
      success: true,
      data: research,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Research not found') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Research not found',
          },
        });
        return;
      }

      // Business logic errors (cannot update approved/rejected research)
      if (error.message.includes('Cannot update research with status')) {
        res.status(422).json({
          success: false,
          error: {
            message: error.message,
          },
        });
        return;
      }

      // Validation errors
      if (error.message.includes('Completion date must be after start date') ||
          error.message.includes('Invalid research type')) {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
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
 * DELETE /api/secretary/research/:id
 * 
 * Delete a research project (soft delete).
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with deleted research data on success
 * @returns HTTP 400 for validation errors
 * @returns HTTP 404 when research not found
 * @returns HTTP 422 for business logic errors (e.g., cannot delete approved research)
 * @throws Error if research deletion fails
 * 
 * Requirements: 8.5, 8.31-8.33, 8.38, 15.4, 15.6
 */
export async function deleteResearchController(
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

    // Delete research via service
    const research = await deleteResearch(id, userId, ipAddress, userAgent);

    // Return HTTP 200 with deleted research
    res.status(200).json({
      success: true,
      data: research,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Research not found') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Research not found',
          },
        });
        return;
      }

      // Business logic errors (cannot delete approved/pending research)
      if (error.message.includes('Cannot delete research with status')) {
        res.status(422).json({
          success: false,
          error: {
            message: error.message,
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
 * POST /api/secretary/research/:id/submit
 * 
 * Submit a research project for approval.
 * Changes status from 'draft' to 'pending_approval'.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with updated research data on success
 * @returns HTTP 400 for validation errors or invalid state transitions
 * @returns HTTP 404 when research not found
 * @throws Error if research submission fails
 * 
 * Requirements: 8.6, 8.20, 8.37, 15.4
 */
export async function submitResearchController(
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

    // Submit research via service
    const research = await submitResearch(id, userId, ipAddress, userAgent);

    // Return HTTP 200 with updated research
    res.status(200).json({
      success: true,
      data: research,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Research not found') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Research not found',
          },
        });
        return;
      }

      // Invalid state transition errors
      if (error.message.includes('Cannot submit research with status')) {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
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
 * POST /api/secretary/research/:id/files
 * 
 * Upload a file for a research project.
 * Handles multipart/form-data with file upload.
 * 
 * @param req - Express request (with file from multer)
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 201 for successful upload
 * @returns HTTP 400 for validation errors
 * @returns HTTP 404 when research not found
 * @throws Error if file upload fails
 * 
 * Requirements: 8.7, 8.22-8.27, 8.37, 15.1
 */
export async function uploadResearchFileController(
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

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded',
        },
      });
      return;
    }

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Upload file via service
    const fileRecord = await uploadResearchFile(
      id,
      req.file,
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 201 with file record
    res.status(201).json({
      success: true,
      data: fileRecord,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Research not found') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Research not found',
          },
        });
        return;
      }

      // Validation errors (file size, file type)
      if (error.message.includes('File size') ||
          error.message.includes('File type') ||
          error.message.includes('No file uploaded')) {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
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
 * GET /api/secretary/research/:id/files
 * 
 * Retrieve all files for a research project.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with file list on success
 * @returns HTTP 400 for validation errors
 * @returns HTTP 404 when research not found
 * @throws Error if file retrieval fails
 * 
 * Requirements: 8.8, 8.35, 15.4
 */
export async function getResearchFilesController(
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

    // Get research files from service
    const files = await getResearchFiles(id);

    // Return HTTP 200 with files
    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Research not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Research not found',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * DELETE /api/secretary/research/:id/files/:fileId
 * 
 * Delete a research file.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with deleted file data on success
 * @returns HTTP 400 for validation errors
 * @returns HTTP 404 when research or file not found
 * @throws Error if file deletion fails
 * 
 * Requirements: 8.9, 8.38, 15.4
 */
export async function deleteResearchFileController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const idResult = idParamSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: idResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Validate fileId parameter
    const fileIdResult = idParamSchema.safeParse({ id: req.params.fileId });
    if (!fileIdResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: fileIdResult.error.errors.map((err) => ({
            field: 'fileId',
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = idResult.data;
    const fileId = fileIdResult.data.id;

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Delete file via service
    const file = await deleteResearchFile(id, fileId, userId, ipAddress, userAgent);

    // Return HTTP 200 with deleted file
    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Research not found' || error.message === 'File not found') {
        res.status(404).json({
          success: false,
          error: {
            message: error.message,
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
 * GET /api/secretary/research/:id/authors
 * 
 * Retrieve authors for a research project.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with author list on success
 * @returns HTTP 400 for validation errors
 * @returns HTTP 404 when research not found
 * @throws Error if author retrieval fails
 * 
 * Requirements: 8.10, 8.35, 15.4
 */
export async function getResearchAuthorsController(
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

    // Get research authors from service
    const authors = await getResearchAuthors(id);

    // Return HTTP 200 with authors
    res.status(200).json({
      success: true,
      data: authors,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Research not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Research not found',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}
