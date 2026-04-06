/**
 * Upload Routes
 * Route definitions for file upload endpoints
 * 
 * Requirements: 20.1, 20.5, 20.6, 30.2
 */

import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';
import { MAX_FILE_SIZE } from '../schemas/upload.schema';

// Configure multer with memory storage
// Files are stored in memory as Buffer objects for processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE, // 10MB limit
  },
});

export function createUploadRoutes(uploadController: UploadController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * POST /api/v1/admin/uploads
   * Upload a file with metadata
   * Content-Type: multipart/form-data
   * Body: file (file), entity_type (string), entity_id (string)
   */
  router.post('/', upload.single('file'), uploadController.uploadFile);

  /**
   * GET /api/v1/admin/uploads/entity/:entityType/:entityId
   * Get all files for a specific entity
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/entity/:entityType/:entityId', uploadController.getEntityUploads);

  /**
   * GET /api/v1/admin/uploads/:id
   * Get upload by ID
   */
  router.get('/:id', uploadController.getUpload);

  /**
   * DELETE /api/v1/admin/uploads/:id
   * Delete file and database record
   */
  router.delete('/:id', uploadController.deleteUpload);

  return router;
}
