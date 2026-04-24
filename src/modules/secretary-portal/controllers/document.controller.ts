/**
 * Document Controller
 * 
 * HTTP request/response handling for secretary portal document operations.
 * Provides document upload, retrieval, download, and deletion operations.
 * 
 * Requirements: 6.1-6.5, 6.23-6.26, 15.1, 15.4, 16.7
 */

import { Request, Response, NextFunction } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
} from '../services/document.service';
import {
  uploadDocumentSchema,
  documentFilterSchema,
} from '../schemas/document.schema';
import { paginationSchema, idParamSchema } from '../schemas/common.schemas';

/**
 * POST /api/secretary/documents
 * 
 * Upload a new document with file.
 * 
 * Request Body (multipart/form-data):
 * - file: Document file (required)
 * - title: Document title (required)
 * - category: Document category (required)
 * - description: Document description (optional)
 * 
 * @param req - Express request with multer file
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 201 for successful upload
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if document upload fails
 * 
 * Requirements: 6.1, 6.23, 15.1
 */
export async function uploadDocumentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate file presence
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: [
            {
              field: 'file',
              message: 'File is required',
            },
          ],
        },
      });
      return;
    }

    // Validate request body
    const bodyResult = uploadDocumentSchema.safeParse(req.body);
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

    // Upload document via service
    const document = await uploadDocument(
      req.file,
      bodyResult.data,
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 201 with created document
    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/documents
 * 
 * Retrieve all documents with pagination and filtering.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - category: Filter by category
 * - start_date: Filter by start date (YYYY-MM-DD)
 * - end_date: Filter by end date (YYYY-MM-DD)
 * - search: Search by title
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with paginated document list on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if document retrieval fails
 * 
 * Requirements: 6.2, 6.24, 15.1
 */
export async function getAllDocumentsController(
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
    const filterResult = documentFilterSchema.safeParse(req.query);
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
    const { category, start_date, end_date, search } = filterResult.data;

    // Get documents from service
    const result = await getAllDocuments(
      { page, limit },
      { category, start_date, end_date },
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
 * GET /api/secretary/documents/:id
 * 
 * Retrieve a document by ID.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with document data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when document not found with entity type
 * @throws Error if document retrieval fails
 * 
 * Requirements: 6.3, 6.25, 15.4
 */
export async function getDocumentByIdController(
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

    // Get document from service
    const document = await getDocumentById(id);

    if (!document) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Document not found',
          entity_type: 'document',
        },
      });
      return;
    }

    // Return HTTP 200 with document data
    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/documents/:id/download
 * 
 * Download a document file.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with file stream on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when document not found with entity type
 * @throws Error if document download fails
 * 
 * Requirements: 6.4, 6.26, 15.4, 16.7
 */
export async function downloadDocumentController(
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

    // Get document from service
    const document = await downloadDocument(id);

    // Build file path for streaming
    const baseDir = process.env.LOCAL_STORAGE_PATH || './uploads';
    const filePath = join(baseDir, document.storage_path);

    // Set appropriate headers for file download
    res.setHeader('Content-Type', document.file_type);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.original_name)}"`
    );
    res.setHeader('Content-Length', document.file_size);

    // Stream file to client
    const fileStream = createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(404).json({
          success: false,
          error: {
            message: 'File not found in storage',
            entity_type: 'document',
          },
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Document not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Document not found',
          entity_type: 'document',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * DELETE /api/secretary/documents/:id
 * 
 * Delete a document (hard delete).
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with deleted document data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when document not found with entity type
 * @throws Error if document deletion fails
 * 
 * Requirements: 6.5, 6.26, 15.4
 */
export async function deleteDocumentController(
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

    // Delete document via service
    const document = await deleteDocument(id, userId, ipAddress, userAgent);

    // Return HTTP 200 with deleted document
    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Document not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Document not found',
          entity_type: 'document',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}
