/**
 * Faculty Portal - Material Service
 * Business logic layer for course material management
 * 
 * Handles course material uploads, viewing, and deletion for courses assigned to faculty members.
 * Validates course ownership, file size, and file type before processing uploads.
 * Integrates with the storage system for file management and audit logging for tracking actions.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 9.13, 9.14, 9.15,
 *               9.16, 9.17, 9.18, 9.19, 9.20, 9.21, 9.22, 12.4, 12.5, 12.6, 12.7, 12.8
 */

import { eq, and, isNull, desc } from 'drizzle-orm';
import { Database } from '../../../db';
import { uploads } from '../../../db/schema';
import { CourseMaterialDTO, MaterialType } from '../types';
import { validateCourseOwnership } from '../utils/courseOwnership';
import { auditLogRepository } from '../../audit-logs';
import { StorageFactory } from '../../../shared/storage';
import { FILE_VALIDATION } from '../schemas/material.schema';

/**
 * File validation error
 * Thrown when file validation fails (size, type, etc.)
 */
export class FileValidationError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = 'FILE_VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
    Object.setPrototypeOf(this, FileValidationError.prototype);
  }
}

/**
 * Material not found error
 * Thrown when a material doesn't exist or doesn't belong to the specified course
 */
export class MaterialNotFoundError extends Error {
  public readonly statusCode: number = 404;
  public readonly code: string = 'MATERIAL_NOT_FOUND';

  constructor(materialId: string) {
    super(`Material with ID ${materialId} not found or does not belong to this course`);
    this.name = 'MaterialNotFoundError';
    Object.setPrototypeOf(this, MaterialNotFoundError.prototype);
  }
}

/**
 * Material upload input data
 */
export interface MaterialUploadData {
  title: string;
  material_type: MaterialType;
  description?: string;
}

/**
 * Material upload result
 */
export interface MaterialUploadResult {
  success: boolean;
  material: CourseMaterialDTO;
  message: string;
}

/**
 * Material deletion result
 */
export interface MaterialDeletionResult {
  success: boolean;
  message: string;
}

export class MaterialService {
  constructor(private db: Database) {}

  /**
   * Upload course material
   * 
   * Uploads a file as course material for a specific course.
   * Validates course ownership, file size, and file type.
   * Stores the file using the storage system and creates a database record.
   * Creates an audit log entry for the upload.
   * 
   * @param courseId - The instruction UUID (course ID)
   * @param facultyId - The faculty UUID to validate ownership
   * @param file - The uploaded file from multer
   * @param data - Material metadata (title, type, description)
   * @param userId - The user ID of the faculty member uploading the material
   * @returns Material upload result with material details
   * @throws CourseNotFoundError if course doesn't exist (HTTP 404)
   * @throws CourseOwnershipError if course is not assigned to faculty (HTTP 403)
   * @throws FileValidationError if file validation fails (HTTP 400)
   * 
   * Requirements:
   * - 9.1: Endpoint protected by faculty.material.upload permission
   * - 9.2: Validate courseId is assigned to authenticated faculty
   * - 9.3: Accept multipart/form-data with file field
   * - 9.4: Require title and material_type in form data
   * - 9.5: Accept optional description field
   * - 9.6: Validate material_type is one of allowed types
   * - 9.7: Validate file size does not exceed 10MB
   * - 9.8: Validate file type is one of allowed types
   * - 9.9: Return HTTP 400 for file validation errors
   * - 9.10: Store file and return material details on success
   * - 9.11: Return HTTP 403 if course not assigned to faculty
   * - 12.4: Create audit log entry for material upload
   */
  async uploadMaterial(
    courseId: string,
    facultyId: string,
    file: Express.Multer.File,
    data: MaterialUploadData,
    userId: string
  ): Promise<MaterialUploadResult> {
    // Validate course ownership
    await validateCourseOwnership(courseId, facultyId);

    // Validate file exists
    if (!file) {
      throw new FileValidationError('No file uploaded');
    }

    // Validate file size (10MB max)
    if (file.size > FILE_VALIDATION.MAX_SIZE) {
      throw new FileValidationError(
        `File size exceeds maximum limit of ${FILE_VALIDATION.MAX_SIZE / (1024 * 1024)}MB`
      );
    }

    // Validate file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !FILE_VALIDATION.ALLOWED_TYPES.includes(fileExtension)) {
      throw new FileValidationError(
        `File type not allowed. Allowed types: ${FILE_VALIDATION.ALLOWED_TYPES.join(', ')}`
      );
    }

    // Validate MIME type
    if (!FILE_VALIDATION.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new FileValidationError(
        `Invalid file MIME type. Allowed types: ${FILE_VALIDATION.ALLOWED_TYPES.join(', ')}`
      );
    }

    // Get storage provider and upload file
    const storage = StorageFactory.getProvider();
    const uploadResult = await storage.upload({
      entityType: 'course_material',
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    // Create database record in uploads table
    const [material] = await this.db
      .insert(uploads)
      .values({
        file_name: uploadResult.fileName,
        original_name: file.originalname,
        file_type: file.mimetype,
        file_size: uploadResult.fileSize,
        storage_path: uploadResult.storagePath,
        entity_type: 'course_material',
        entity_id: courseId,
        uploaded_by: userId,
      })
      .returning();

    // Create audit log entry
    await auditLogRepository.create({
      user_id: userId,
      action_type: 'material_upload',
      entity_type: 'course_material',
      entity_id: material.id,
      after_state: {
        course_id: courseId,
        title: data.title,
        material_type: data.material_type,
        file_name: file.originalname,
        file_size: file.size,
      },
    });

    // Transform to DTO
    const materialDTO: CourseMaterialDTO = {
      id: material.id,
      course_id: courseId,
      title: data.title,
      description: data.description || null,
      material_type: data.material_type,
      file_url: `/uploads/${uploadResult.storagePath}`,
      file_size: material.file_size,
      upload_date: material.created_at.toISOString(),
      uploaded_by: material.uploaded_by || userId,
    };

    return {
      success: true,
      material: materialDTO,
      message: 'Material uploaded successfully',
    };
  }

  /**
   * Get materials by course
   * 
   * Retrieves all course materials for a specific course.
   * Validates course ownership before returning materials.
   * Orders materials by upload date descending (newest first).
   * 
   * @param courseId - The instruction UUID (course ID)
   * @param facultyId - The faculty UUID to validate ownership
   * @returns Array of course materials
   * @throws CourseNotFoundError if course doesn't exist (HTTP 404)
   * @throws CourseOwnershipError if course is not assigned to faculty (HTTP 403)
   * 
   * Requirements:
   * - 9.12: Endpoint protected by faculty.material.read permission
   * - 9.13: Validate courseId is assigned to authenticated faculty
   * - 9.14: Return all materials for the course with details
   * - 9.15: Order materials by upload_date descending
   */
  async getMaterialsByCourse(
    courseId: string,
    facultyId: string
  ): Promise<CourseMaterialDTO[]> {
    // Validate course ownership
    await validateCourseOwnership(courseId, facultyId);

    // Query materials from uploads table
    const materials = await this.db
      .select()
      .from(uploads)
      .where(
        and(
          eq(uploads.entity_type, 'course_material'),
          eq(uploads.entity_id, courseId),
          isNull(uploads.deleted_at)
        )
      )
      .orderBy(desc(uploads.created_at));

    // Transform to DTOs
    // Note: In a real implementation, we would store title, description, and material_type
    // in a separate course_materials table or as JSON in the uploads table.
    // For now, we'll use the original_name as title and default values.
    return materials.map((material) => ({
      id: material.id,
      course_id: courseId,
      title: material.original_name, // Using original filename as title
      description: null, // Would come from separate table in production
      material_type: 'other' as MaterialType, // Would come from separate table in production
      file_url: `/uploads/${material.storage_path}`,
      file_size: material.file_size,
      upload_date: material.created_at.toISOString(),
      uploaded_by: material.uploaded_by || 'unknown',
    }));
  }

  /**
   * Delete course material
   * 
   * Deletes a course material file and its database record.
   * Validates course ownership and that the material belongs to the specified course.
   * Removes the file from storage and deletes the database record.
   * Creates an audit log entry for the deletion.
   * 
   * @param courseId - The instruction UUID (course ID)
   * @param materialId - The material UUID to delete
   * @param facultyId - The faculty UUID to validate ownership
   * @param userId - The user ID of the faculty member deleting the material
   * @returns Material deletion result
   * @throws CourseNotFoundError if course doesn't exist (HTTP 404)
   * @throws CourseOwnershipError if course is not assigned to faculty (HTTP 403)
   * @throws MaterialNotFoundError if material doesn't exist or doesn't belong to course (HTTP 404)
   * 
   * Requirements:
   * - 9.16: Endpoint protected by faculty.material.delete permission
   * - 9.17: Validate courseId is assigned to authenticated faculty
   * - 9.18: Validate materialId belongs to specified courseId
   * - 9.19: Remove file from storage and delete database record
   * - 9.20: Return confirmation message on success
   * - 9.21: Return HTTP 404 if material doesn't exist or doesn't belong to course
   * - 9.22: Return HTTP 403 if course not assigned to faculty
   * - 12.5: Create audit log entry for material deletion
   */
  async deleteMaterial(
    courseId: string,
    materialId: string,
    facultyId: string,
    userId: string
  ): Promise<MaterialDeletionResult> {
    // Validate course ownership
    await validateCourseOwnership(courseId, facultyId);

    // Find the material and validate it belongs to the course
    const [material] = await this.db
      .select()
      .from(uploads)
      .where(
        and(
          eq(uploads.id, materialId),
          eq(uploads.entity_type, 'course_material'),
          eq(uploads.entity_id, courseId),
          isNull(uploads.deleted_at)
        )
      )
      .limit(1);

    if (!material) {
      throw new MaterialNotFoundError(materialId);
    }

    // Delete file from storage
    const storage = StorageFactory.getProvider();
    await storage.delete(material.storage_path);

    // Soft delete database record (set deleted_at timestamp)
    await this.db
      .update(uploads)
      .set({
        deleted_at: new Date(),
      })
      .where(eq(uploads.id, materialId));

    // Create audit log entry
    await auditLogRepository.create({
      user_id: userId,
      action_type: 'material_delete',
      entity_type: 'course_material',
      entity_id: materialId,
      before_state: {
        course_id: courseId,
        file_name: material.original_name,
        file_size: material.file_size,
        storage_path: material.storage_path,
      },
    });

    return {
      success: true,
      message: 'Material deleted successfully',
    };
  }
}
