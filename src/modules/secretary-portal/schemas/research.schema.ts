/**
 * Research Validation Schemas for Secretary Portal
 * Zod schemas for validating research-related input
 * 
 * Requirements: 8.15-8.18, 8.23-8.24
 */

import { z } from 'zod';
import { researchTypeEnum, approvalStatusEnum } from './common.schemas';

/**
 * Allowed file types for research file uploads
 */
const ALLOWED_RESEARCH_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
];

/**
 * Allowed file extensions for research file uploads
 */
const ALLOWED_RESEARCH_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip'];

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_RESEARCH_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Schema for creating a new research project
 * Validates all required fields for research creation
 * Includes validation for start_date not in past and completion_date after start_date
 * 
 * Requirements: 8.15, 8.16, 8.17, 8.18
 */
export const createResearchSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(500, 'Title must be at most 500 characters'),
    research_type: researchTypeEnum,
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD'),
    completion_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
      .optional(),
    abstract: z
      .string()
      .max(2000, 'Abstract must be at most 2000 characters')
      .optional(),
    publication_url: z
      .string()
      .url('Invalid URL format')
      .max(500, 'Publication URL must be at most 500 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // Validate start_date is not in the past
      const startDate = new Date(data.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      return startDate >= today;
    },
    {
      message: 'Start date cannot be in the past',
      path: ['start_date'],
    }
  )
  .refine(
    (data) => {
      // Validate completion_date is after start_date if provided
      if (data.completion_date) {
        const completionDate = new Date(data.completion_date);
        const startDate = new Date(data.start_date);
        return completionDate > startDate;
      }
      return true;
    },
    {
      message: 'Completion date must be after start date',
      path: ['completion_date'],
    }
  );

/**
 * Schema for updating an existing research project
 * All fields are optional for partial updates
 * Includes same validations as create schema when fields are provided
 * 
 * Requirements: 8.15, 8.16, 8.17, 8.18
 */
export const updateResearchSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(500, 'Title must be at most 500 characters')
      .optional(),
    research_type: researchTypeEnum.optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
      .optional(),
    completion_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
      .optional(),
    abstract: z
      .string()
      .max(2000, 'Abstract must be at most 2000 characters')
      .optional(),
    publication_url: z
      .string()
      .url('Invalid URL format')
      .max(500, 'Publication URL must be at most 500 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // Only validate if both start_date and completion_date are provided
      if (data.start_date && data.completion_date) {
        const completionDate = new Date(data.completion_date);
        const startDate = new Date(data.start_date);
        return completionDate > startDate;
      }
      return true;
    },
    {
      message: 'Completion date must be after start date',
      path: ['completion_date'],
    }
  );

/**
 * Schema for uploading a research file
 * Validates file metadata
 * 
 * Requirements: 8.23, 8.24
 */
export const uploadResearchFileSchema = z.object({
  file_type: z
    .string()
    .max(100, 'File type must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
});

/**
 * Schema for validating uploaded research file metadata
 * Used after multer processes the file
 * 
 * Requirements: 8.23, 8.24
 */
export const researchFileMetadataSchema = z.object({
  originalname: z.string(),
  mimetype: z
    .string()
    .refine(
      (mimetype) => ALLOWED_RESEARCH_FILE_TYPES.includes(mimetype),
      {
        message: `File type not allowed. Allowed types: ${ALLOWED_RESEARCH_FILE_EXTENSIONS.join(', ')}`,
      }
    ),
  size: z
    .number()
    .max(MAX_RESEARCH_FILE_SIZE, `File size must not exceed ${MAX_RESEARCH_FILE_SIZE / (1024 * 1024)}MB`),
  filename: z.string(),
  path: z.string(),
});

/**
 * Schema for research filtering query parameters
 * Used for filtering research lists
 */
export const researchFilterSchema = z.object({
  research_type: researchTypeEnum.optional(),
  status: approvalStatusEnum.optional(),
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
 * Helper function to validate research file extension
 * 
 * @param filename - The filename to validate
 * @returns true if extension is allowed, false otherwise
 */
export function isAllowedResearchFileExtension(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? ALLOWED_RESEARCH_FILE_EXTENSIONS.includes(extension) : false;
}

/**
 * Helper function to validate research file size
 * 
 * @param size - File size in bytes
 * @returns true if size is within limit, false otherwise
 */
export function isValidResearchFileSize(size: number): boolean {
  return size <= MAX_RESEARCH_FILE_SIZE;
}

export type CreateResearchInput = z.infer<typeof createResearchSchema>;
export type UpdateResearchInput = z.infer<typeof updateResearchSchema>;
export type UploadResearchFileInput = z.infer<typeof uploadResearchFileSchema>;
export type ResearchFileMetadata = z.infer<typeof researchFileMetadataSchema>;
export type ResearchFilterInput = z.infer<typeof researchFilterSchema>;

export {
  ALLOWED_RESEARCH_FILE_TYPES,
  ALLOWED_RESEARCH_FILE_EXTENSIONS,
  MAX_RESEARCH_FILE_SIZE,
};
