/**
 * Document Routes
 * 
 * Defines routes for secretary portal document operations.
 * All routes require authentication and appropriate permissions.
 * 
 * Requirements: 6.6-6.8
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { documentUpload } from '../utils/fileUpload';
import {
  uploadDocumentController,
  getAllDocumentsController,
  getDocumentByIdController,
  downloadDocumentController,
  deleteDocumentController,
} from '../controllers/document.controller';

/**
 * Create document router
 * 
 * Endpoints:
 * - POST /api/secretary/documents - Upload a new document
 * - GET /api/secretary/documents - Get all documents with pagination and filtering
 * - GET /api/secretary/documents/:id - Get document by ID
 * - GET /api/secretary/documents/:id/download - Download document file
 * - DELETE /api/secretary/documents/:id - Delete a document (hard delete)
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate permission for the operation
 */
export function createDocumentRoutes(): Router {
  const router = Router();

  /**
   * POST /api/secretary/documents
   * 
   * Upload a new document with file.
   * Uses multer middleware for multipart/form-data handling.
   * 
   * Requirements: 6.6
   */
  router.post(
    '/',
    requirePermission('secretary.document.upload'),
    documentUpload.single('file'),
    uploadDocumentController
  );

  /**
   * GET /api/secretary/documents
   * 
   * Retrieve all documents with pagination and filtering.
   * 
   * Requirements: 6.7
   */
  router.get(
    '/',
    requirePermission('secretary.document.read'),
    getAllDocumentsController
  );

  /**
   * GET /api/secretary/documents/:id
   * 
   * Retrieve a document by ID.
   * 
   * Requirements: 6.7
   */
  router.get(
    '/:id',
    requirePermission('secretary.document.read'),
    getDocumentByIdController
  );

  /**
   * GET /api/secretary/documents/:id/download
   * 
   * Download a document file.
   * 
   * Requirements: 6.7
   */
  router.get(
    '/:id/download',
    requirePermission('secretary.document.read'),
    downloadDocumentController
  );

  /**
   * DELETE /api/secretary/documents/:id
   * 
   * Delete a document (hard delete).
   * 
   * Requirements: 6.8
   */
  router.delete(
    '/:id',
    requirePermission('secretary.document.delete'),
    deleteDocumentController
  );

  return router;
}

// Default export for backward compatibility
export default createDocumentRoutes();
