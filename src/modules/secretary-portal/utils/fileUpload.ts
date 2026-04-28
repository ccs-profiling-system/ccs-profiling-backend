/**
 * File Upload Utility
 * Provides multer middleware configuration and file validation for secretary portal
 * 
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../../../shared/errors';

/**
 * Maximum file size: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Allowed file types for documents
 */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
];

/**
 * Allowed file types for research files
 */
export const ALLOWED_RESEARCH_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
];

/**
 * File extension to MIME type mapping
 */
const EXTENSION_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
};

/**
 * Sanitize filename to prevent path traversal attacks
 * 
 * Removes:
 * - Path separators (/, \)
 * - Parent directory references (..)
 * - Hidden file indicators (.)
 * - Special characters that could be dangerous
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 * 
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and parent directory references
  let sanitized = filename.replace(/[/\\]/g, '');
  sanitized = sanitized.replace(/\.\./g, '');
  
  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Remove special characters except alphanumeric, dash, underscore, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Ensure filename is not empty or only underscores after sanitization
  if (!sanitized || sanitized.length === 0 || /^_+$/.test(sanitized)) {
    sanitized = 'file';
  }
  
  return sanitized;
}

/**
 * Generate unique filename to prevent collisions
 * 
 * Format: {uuid}_{sanitized_original_name}
 * 
 * @param originalFilename - Original filename
 * @returns Unique filename
 * 
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized);
  const nameWithoutExt = path.basename(sanitized, ext);
  const uuid = uuidv4();
  
  return `${uuid}_${nameWithoutExt}${ext}`;
}

/**
 * Validate file size
 * 
 * @param fileSize - File size in bytes
 * @throws ValidationError if file size exceeds maximum
 * 
 */
export function validateFileSize(fileSize: number): void {
  if (fileSize > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size ${fileSize} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (10MB)`
    );
  }
}

/**
 * Validate file type
 * 
 * @param mimeType - File MIME type
 * @param allowedTypes - Array of allowed MIME types
 * @throws ValidationError if file type is not allowed
 * 
 */
export function validateFileType(mimeType: string, allowedTypes: string[]): void {
  if (!allowedTypes.includes(mimeType)) {
    throw new ValidationError(
      `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  }
}

/**
 * Validate file extension matches MIME type
 * 
 * @param filename - Original filename
 * @param mimeType - File MIME type
 * @throws ValidationError if extension doesn't match MIME type
 * 
 */
export function validateFileExtension(filename: string, mimeType: string): void {
  const ext = path.extname(filename).toLowerCase();
  const expectedMimeType = EXTENSION_TO_MIME[ext];
  
  if (expectedMimeType && expectedMimeType !== mimeType) {
    throw new ValidationError(
      `File extension ${ext} does not match MIME type ${mimeType}`
    );
  }
}

/**
 * Validate uploaded file
 * 
 * @param file - Multer file object
 * @param allowedTypes - Array of allowed MIME types
 * @throws ValidationError if file is invalid
 * 
 */
export function validateUploadedFile(
  file: Express.Multer.File | undefined,
  allowedTypes: string[]
): void {
  if (!file) {
    throw new ValidationError('No file uploaded');
  }

  // Validate file size
  validateFileSize(file.size);

  // Validate file type
  validateFileType(file.mimetype, allowedTypes);

  // Validate file extension matches MIME type
  validateFileExtension(file.originalname, file.mimetype);
}

/**
 * Configure multer middleware for document uploads
 * 
 * Uses memory storage (files stored in memory as Buffer objects)
 * Files are processed by the storage service
 * 
 */
export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      // Validate file type
      validateFileType(file.mimetype, ALLOWED_DOCUMENT_TYPES);
      
      // Validate file extension matches MIME type
      validateFileExtension(file.originalname, file.mimetype);
      
      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  },
});

/**
 * Configure multer middleware for research file uploads
 * 
 * Uses memory storage (files stored in memory as Buffer objects)
 * Files are processed by the storage service
 * 
 */
export const researchUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      // Validate file type
      validateFileType(file.mimetype, ALLOWED_RESEARCH_TYPES);
      
      // Validate file extension matches MIME type
      validateFileExtension(file.originalname, file.mimetype);
      
      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  },
});

/**
 * Get file extension from MIME type
 * 
 * @param mimeType - File MIME type
 * @returns File extension (with dot)
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const entry = Object.entries(EXTENSION_TO_MIME).find(([, mime]) => mime === mimeType);
  return entry ? entry[0] : '.bin';
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
