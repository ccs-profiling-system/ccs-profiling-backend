/**
 * Uploads Module
 * Exports all upload-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and file storage orchestration
 * - Repository: Database access layer
 */

import { db } from '../../db';
import { UploadRepository } from './repositories/upload.repository';
import { UploadService } from './services/upload.service';
import { UploadController } from './controllers/upload.controller';
import { createUploadRoutes } from './routes/upload.routes';

// Initialize repository
const uploadRepository = new UploadRepository(db);

// Initialize service
const uploadService = new UploadService(uploadRepository);

// Initialize controller
const uploadController = new UploadController(uploadService);

// Create routes
const uploadRoutes = createUploadRoutes(uploadController);

// Exports
export { uploadRoutes };
export * from './types';
export * from './schemas/upload.schema';
export { UploadRepository } from './repositories/upload.repository';
export { UploadService } from './services/upload.service';
export { UploadController } from './controllers/upload.controller';
