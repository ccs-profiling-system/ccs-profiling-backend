/**
 * Research Routes
 * 
 * Defines routes for secretary portal research operations.
 * All routes require authentication and appropriate permissions.
 * 
 * Requirements: 8.11-8.14
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { researchUpload } from '../utils/fileUpload';
import {
  getAllResearchController,
  getResearchByIdController,
  createResearchController,
  updateResearchController,
  deleteResearchController,
  submitResearchController,
  uploadResearchFileController,
  getResearchFilesController,
  deleteResearchFileController,
  getResearchAuthorsController,
} from '../controllers/research.controller';

/**
 * Create research router
 * 
 * Endpoints:
 * - GET /api/secretary/research - Get all research with pagination and filtering
 * - GET /api/secretary/research/:id - Get research by ID
 * - POST /api/secretary/research - Create a new research project
 * - PUT /api/secretary/research/:id - Update an existing research project
 * - DELETE /api/secretary/research/:id - Delete a research project (soft delete)
 * - POST /api/secretary/research/:id/submit - Submit a research project for approval
 * - POST /api/secretary/research/:id/files - Upload a file for a research project
 * - GET /api/secretary/research/:id/files - Get files for a research project
 * - DELETE /api/secretary/research/:id/files/:fileId - Delete a research file
 * - GET /api/secretary/research/:id/authors - Get authors for a research project
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate permission for the operation
 */
export function createResearchRoutes(): Router {
  const router = Router();

  /**
   * GET /api/secretary/research
   * 
   * Retrieve all research projects with pagination and filtering.
   * 
   * Requirements: 8.1, 8.11
   */
  router.get(
    '/',
    requirePermission('secretary.research.read'),
    getAllResearchController
  );

  /**
   * GET /api/secretary/research/:id
   * 
   * Retrieve a research project by ID.
   * 
   * Requirements: 8.2, 8.11
   */
  router.get(
    '/:id',
    requirePermission('secretary.research.read'),
    getResearchByIdController
  );

  /**
   * POST /api/secretary/research
   * 
   * Create a new research project.
   * 
   * Requirements: 8.3, 8.12
   */
  router.post(
    '/',
    requirePermission('secretary.research.create'),
    createResearchController
  );

  /**
   * PUT /api/secretary/research/:id
   * 
   * Update an existing research project.
   * 
   * Requirements: 8.4, 8.13
   */
  router.put(
    '/:id',
    requirePermission('secretary.research.update'),
    updateResearchController
  );

  /**
   * DELETE /api/secretary/research/:id
   * 
   * Delete a research project (soft delete).
   * 
   * Requirements: 8.5, 8.14
   */
  router.delete(
    '/:id',
    requirePermission('secretary.research.delete'),
    deleteResearchController
  );

  /**
   * POST /api/secretary/research/:id/submit
   * 
   * Submit a research project for approval.
   * Changes status from 'draft' to 'pending_approval'.
   * 
   * Requirements: 8.6, 8.13
   */
  router.post(
    '/:id/submit',
    requirePermission('secretary.research.update'),
    submitResearchController
  );

  /**
   * POST /api/secretary/research/:id/files
   * 
   * Upload a file for a research project.
   * Uses multer middleware for multipart/form-data handling.
   * 
   * Requirements: 8.7, 8.13
   */
  router.post(
    '/:id/files',
    requirePermission('secretary.research.update'),
    researchUpload.single('file'),
    uploadResearchFileController
  );

  /**
   * GET /api/secretary/research/:id/files
   * 
   * Retrieve files for a research project.
   * 
   * Requirements: 8.8, 8.11
   */
  router.get(
    '/:id/files',
    requirePermission('secretary.research.read'),
    getResearchFilesController
  );

  /**
   * DELETE /api/secretary/research/:id/files/:fileId
   * 
   * Delete a research file.
   * 
   * Requirements: 8.9, 8.14
   */
  router.delete(
    '/:id/files/:fileId',
    requirePermission('secretary.research.delete'),
    deleteResearchFileController
  );

  /**
   * GET /api/secretary/research/:id/authors
   * 
   * Retrieve authors for a research project.
   * 
   * Requirements: 8.10, 8.11
   */
  router.get(
    '/:id/authors',
    requirePermission('secretary.research.read'),
    getResearchAuthorsController
  );

  return router;
}

// Default export for backward compatibility
export default createResearchRoutes();
