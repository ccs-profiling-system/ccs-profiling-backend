/**
 * Upload Validation Schemas
 * Zod schemas for validating upload input
 * 
 * Requirements: 20.3, 20.4, 21.2, 21.4
 */

import { z } from 'zod';

/**
 * Schema for upload ID parameter validation
 */
export const uploadIdParamSchema = z.object({
  id: z.string().uuid('Invalid upload ID format'),
});

/**
 * Schema for entity type and ID parameters
 */
export const entityParamsSchema = z.object({
  entityType: z.enum(['student', 'faculty', 'research', 'event'], {
    errorMap: () => ({ message: 'Entity type must be one of: student, faculty, research, event' }),
  }),
  entityId: z.string().uuid('Invalid entity ID format'),
});

/**
 * Schema for upload metadata validation
 */
export const uploadMetadataSchema = z.object({
  entity_type: z.enum(['student', 'faculty', 'research', 'event'], {
    errorMap: () => ({ message: 'Entity type must be one of: student, faculty, research, event' }),
  }),
  entity_id: z.string().uuid('Invalid entity ID format'),
});

/**
 * Allowed MIME types for file uploads
 * Supports common document and image types
 */
export const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

/**
 * Maximum file size: 10MB (10485760 bytes)
 * Requirement: 20.4
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
