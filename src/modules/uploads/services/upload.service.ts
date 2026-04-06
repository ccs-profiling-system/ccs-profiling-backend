/**
 * Upload Service
 * Business logic layer for file upload operations
 * 
 * Requirements: 20.1, 20.3, 20.4, 20.5, 20.6, 31.4, 31.5, 31.6, 31.7
 */

import { UploadRepository } from '../repositories/upload.repository';
import { NotFoundError, ValidationError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import { StorageFactory } from '../../../shared/storage';
import { UploadResponseDTO, UploadMetadataDTO } from '../types';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../schemas/upload.schema';

export class UploadService {
  constructor(
    private uploadRepository: UploadRepository
  ) {}

  /**
   * Upload a file with metadata tracking
   * Validates file type and size, stores file, and creates database record
   * Requirements: 20.1, 20.3, 20.4, 20.5, 31.4, 31.5, 31.6, 31.7
   */
  async uploadFile(
    file: Express.Multer.File,
    metadata: UploadMetadataDTO,
    uploadedBy?: string
  ): Promise<UploadResponseDTO> {
    // Validate file type (Requirement 20.3)
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
      throw new ValidationError(
        `File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // Validate file size (Requirement 20.4 - 10MB limit)
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File size ${file.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (10MB)`
      );
    }

    // Get storage provider
    const storage = StorageFactory.getProvider();

    // Upload file to storage (Requirements 31.4, 31.5, 31.6, 31.7)
    const uploadResult = await storage.upload({
      entityType: metadata.entity_type,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    // Create database record with full storage path (Requirement 31.7)
    const id = generateUUIDv7();
    const upload = await this.uploadRepository.create({
      id,
      file_name: uploadResult.fileName,
      original_name: file.originalname,
      file_type: file.mimetype,
      file_size: uploadResult.fileSize,
      storage_path: uploadResult.storagePath, // Full storage path
      entity_type: metadata.entity_type,
      entity_id: metadata.entity_id,
      uploaded_by: uploadedBy,
    });

    return this.toResponseDTO(upload);
  }

  /**
   * Get upload by ID
   * Requirement: 20.1
   */
  async getUpload(id: string): Promise<UploadResponseDTO> {
    const upload = await this.uploadRepository.findById(id);
    if (!upload) {
      throw new NotFoundError('Upload not found');
    }
    return this.toResponseDTO(upload);
  }

  /**
   * Delete file and database record
   * Requirements: 20.5, 20.6
   */
  async deleteFile(id: string): Promise<void> {
    const upload = await this.uploadRepository.findById(id);
    if (!upload) {
      throw new NotFoundError('Upload not found');
    }

    // Delete file from storage
    const storage = StorageFactory.getProvider();
    await storage.delete(upload.storage_path);

    // Delete database record
    await this.uploadRepository.delete(id);
  }

  /**
   * Get all files for a specific entity
   * Requirement: 20.1
   */
  async getEntityFiles(entityType: string, entityId: string): Promise<UploadResponseDTO[]> {
    const uploads = await this.uploadRepository.findByEntityId(entityType, entityId);
    return uploads.map((upload) => this.toResponseDTO(upload));
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(upload: any): UploadResponseDTO {
    return {
      id: upload.id,
      file_name: upload.file_name,
      original_name: upload.original_name,
      file_type: upload.file_type,
      file_size: upload.file_size,
      storage_path: upload.storage_path,
      entity_type: upload.entity_type,
      entity_id: upload.entity_id,
      uploaded_by: upload.uploaded_by || undefined,
      created_at: upload.created_at.toISOString(),
      updated_at: upload.updated_at.toISOString(),
    };
  }
}
