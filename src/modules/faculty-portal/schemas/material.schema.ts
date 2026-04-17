import { z } from 'zod';
import { materialTypeSchema } from './common.schemas';

/**
 * Upload material schema
 * Required: title, material_type
 * Optional: description
 * File validation: max size 10MB, allowed types: pdf, doc, docx, ppt, pptx, xls, xlsx, zip
 */
export const uploadMaterialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  material_type: materialTypeSchema,
  description: z.string().optional(),
});

/**
 * File validation constants
 */
export const FILE_VALIDATION = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
  ],
} as const;

/**
 * Validates file upload requirements
 * @param file - The uploaded file object
 * @returns Validation result with error message if invalid
 */
export function validateFileUpload(file: Express.Multer.File | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: 'No file uploaded' };
  }

  // Check file size
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${FILE_VALIDATION.MAX_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file extension
  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
  if (!fileExtension || !FILE_VALIDATION.ALLOWED_TYPES.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${FILE_VALIDATION.ALLOWED_TYPES.join(', ')}`,
    };
  }

  // Check MIME type
  if (!FILE_VALIDATION.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file MIME type. Allowed types: ${FILE_VALIDATION.ALLOWED_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

export type UploadMaterialInput = z.infer<typeof uploadMaterialSchema>;
