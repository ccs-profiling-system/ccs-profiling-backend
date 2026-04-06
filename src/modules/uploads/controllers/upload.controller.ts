/**
 * Upload Controller
 * HTTP request/response handling for file upload operations
 * 
 * Requirements: 20.1, 20.5, 20.6, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { ValidationError } from '../../../shared/errors';
import {
  uploadIdParamSchema,
  entityParamsSchema,
  uploadMetadataSchema,
} from '../schemas/upload.schema';

export class UploadController {
  constructor(private uploadService: UploadService) {}

  /**
   * POST /api/v1/admin/uploads
   * Upload a file with metadata
   * Requirements: 20.1, 30.2
   */
  uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      // Validate metadata from request body
      const validationResult = uploadMetadataSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const metadata = validationResult.data;
      const uploadedBy = req.user?.userId;

      const upload = await this.uploadService.uploadFile(req.file, metadata, uploadedBy);

      res.status(201).json({
        success: true,
        data: upload,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/uploads/:id
   * Get upload by ID
   * Requirements: 20.1, 30.2
   */
  getUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = uploadIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid upload ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const upload = await this.uploadService.getUpload(id);

      res.json({
        success: true,
        data: upload,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/uploads/:id
   * Delete file and database record
   * Requirements: 20.5, 20.6, 30.2
   */
  deleteUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = uploadIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid upload ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.uploadService.deleteFile(id);

      res.json({
        success: true,
        data: {
          message: 'Upload deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/uploads/entity/:entityType/:entityId
   * Get all files for a specific entity
   * Requirements: 20.1, 30.2
   */
  getEntityUploads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate entity parameters
      const validationResult = entityParamsSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid entity parameters', validationResult.error.errors);
      }

      const { entityType, entityId } = validationResult.data;

      const uploads = await this.uploadService.getEntityFiles(entityType, entityId);

      res.json({
        success: true,
        data: uploads,
      });
    } catch (error) {
      next(error);
    }
  };
}
