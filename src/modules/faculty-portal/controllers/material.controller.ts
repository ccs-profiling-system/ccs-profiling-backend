/**
 * Faculty Portal - Material Controller
 * HTTP request/response handling for course material management operations
 * 
 * Handles course material uploads, viewing, and deletion for courses assigned to faculty members.
 * All operations validate course ownership to ensure faculty can only manage materials
 * for their assigned courses. File uploads are handled using multer middleware with
 * validation for file size and type.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { MaterialService } from '../services/material.service';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';
import { FacultyUserContext } from '../utils/facultyScope';
import { uploadMaterialSchema } from '../schemas/material.schema';
import { ValidationError } from '../../../shared/errors';
import { z } from 'zod';

/**
 * Validation schema for courseId route parameter
 */
const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format'),
});

/**
 * Validation schema for materialId route parameter
 */
const materialIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format'),
  materialId: z.string().uuid('Invalid material ID format'),
});

export class MaterialController {
  constructor(private materialService: MaterialService) {}

  /**
   * POST /api/faculty/courses/:courseId/materials
   * Upload course material with file
   * 
   * Extracts faculty_id from the authenticated user's JWT token and validates
   * that the course is assigned to the faculty member. Accepts multipart/form-data
   * with file upload. Validates file size (max 10MB) and file type (pdf, doc, docx,
   * ppt, pptx, xls, xlsx, zip). Creates a database record and stores the file.
   * 
   * Route Parameters:
   * - courseId (required): UUID of the course (instruction_id)
   * 
   * Request Body (multipart/form-data):
   * - file (required): The file to upload
   * - title (required): Title of the material
   * - material_type (required): One of 'lecture_notes', 'assignment', 'reading_material', 'syllabus', 'exam', 'other'
   * - description (optional): Description of the material
   * 
   * Returns:
   * - 200: Material upload result with material details
   * - 400: If file validation fails or invalid input data
   * - 403: If course is not assigned to the authenticated faculty member
   * - 404: If course doesn't exist
   * 
   */
  uploadMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate courseId parameter
      const paramValidation = courseIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid course ID', paramValidation.error.errors);
      }

      // Validate request body (form data)
      const bodyValidation = uploadMaterialSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      // Check if file was uploaded
      if (!req.file) {
        throw new ValidationError('No file uploaded', [
          {
            code: 'custom',
            path: ['file'],
            message: 'File is required',
          },
        ]);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);
      const userId = (authenticatedReq.user as FacultyUserContext).userId;

      const { courseId } = paramValidation.data;
      const materialData = bodyValidation.data;

      // Upload material
      // Service will validate course ownership, file size, and file type
      // Throws CourseOwnershipError (403) if course not assigned
      // Throws FileValidationError (400) if file validation fails
      const result = await this.materialService.uploadMaterial(
        courseId,
        facultyId,
        req.file,
        materialData,
        userId
      );

      res.json({
        success: true,
        data: result.material,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/faculty/courses/:courseId/materials
   * Get all materials for a course
   * 
   * Extracts faculty_id from the authenticated user's JWT token and validates
   * that the course is assigned to the faculty member. Returns all materials
   * for the course ordered by upload date descending (newest first).
   * 
   * Route Parameters:
   * - courseId (required): UUID of the course (instruction_id)
   * 
   * Returns:
   * - 200: Array of course materials with details
   * - 400: If invalid course ID format
   * - 403: If course is not assigned to the authenticated faculty member
   * - 404: If course doesn't exist
   * 
   */
  getMaterials = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate courseId parameter
      const paramValidation = courseIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid course ID', paramValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      const { courseId } = paramValidation.data;

      // Retrieve materials
      // Service will validate course ownership and throw CourseOwnershipError (403) if not assigned
      const materials = await this.materialService.getMaterialsByCourse(
        courseId,
        facultyId
      );

      res.json({
        success: true,
        data: materials,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/faculty/courses/:courseId/materials/:materialId
   * Delete a course material
   * 
   * Extracts faculty_id from the authenticated user's JWT token and validates
   * that the course is assigned to the faculty member. Validates that the material
   * belongs to the specified course. Removes the file from storage and deletes
   * the database record. Creates an audit log entry for the deletion.
   * 
   * Route Parameters:
   * - courseId (required): UUID of the course (instruction_id)
   * - materialId (required): UUID of the material to delete
   * 
   * Returns:
   * - 200: Confirmation message
   * - 400: If invalid course ID or material ID format
   * - 403: If course is not assigned to the authenticated faculty member
   * - 404: If material doesn't exist or doesn't belong to the course
   * 
   */
  deleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate route parameters
      const paramValidation = materialIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid parameters', paramValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);
      const userId = (authenticatedReq.user as FacultyUserContext).userId;

      const { courseId, materialId } = paramValidation.data;

      // Delete material
      // Service will validate course ownership and material existence
      // Throws CourseOwnershipError (403) if course not assigned
      // Throws MaterialNotFoundError (404) if material doesn't exist or doesn't belong to course
      const result = await this.materialService.deleteMaterial(
        courseId,
        materialId,
        facultyId,
        userId
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}
