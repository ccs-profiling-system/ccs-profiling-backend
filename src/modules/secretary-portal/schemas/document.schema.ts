/**
 * Document Validation Schemas for Secretary Portal
 * Zod schemas for validating document-related input
 * 
 */

import { z } from 'zod';
import { documentCategoryEnum } from './common.schemas';

/**
 * Allowed file types for document uploads
 */
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
];

/**
 * Allowed file extensions for document uploads
 */
const ALLOWED_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'];

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Schema for uploading a document
 * Validates title, category, and file metadata
 * Note: Actual file validation happens in multer middleware
 * 
 */
export const uploadDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  category: documentCategoryEnum,
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
  tags: z
    .string()
    .max(500, 'Tags must be at most 500 characters')
    .optional(),
});

/**
 * Schema for validating uploaded file metadata
 * Used after multer processes the file
 * 
 */
export const fileMetadataSchema = z.object({
  originalname: z.string(),
  mimetype: z
    .string()
    .refine(
      (mimetype) => ALLOWED_FILE_TYPES.includes(mimetype),
      {
        message: `File type not allowed. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`,
      }
    ),
  size: z
    .number()
    .max(MAX_FILE_SIZE, `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`),
  filename: z.string(),
  path: z.string(),
});

/**
 * Schema for document filtering query parameters
 * Used for filtering document lists
 */
export const documentFilterSchema = z.object({
  category: documentCategoryEnum.optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  search: z
    .string()
    .max(200, 'Search query must be at most 200 characters')
    .optional(),
});

/**
 * Helper function to validate file extension
 * 
 * @param filename - The filename to validate
 * @returns true if extension is allowed, false otherwise
 */
export function isAllowedFileExtension(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? ALLOWED_FILE_EXTENSIONS.includes(extension) : false;
}

/**
 * Helper function to validate file size
 * 
 * @param size - File size in bytes
 * @returns true if size is within limit, false otherwise
 */
export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>;

export { ALLOWED_FILE_TYPES, ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE };
