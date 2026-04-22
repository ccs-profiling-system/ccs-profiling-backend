/**
 * File Upload Utility Tests
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeFilename,
  generateUniqueFilename,
  validateFileSize,
  validateFileType,
  validateFileExtension,
  validateUploadedFile,
  MAX_FILE_SIZE,
  ALLOWED_DOCUMENT_TYPES,
  formatFileSize,
  getExtensionFromMimeType,
} from './fileUpload';
import { ValidationError } from '../../../shared/errors';

describe('File Upload Utility', () => {
  describe('sanitizeFilename', () => {
    it('should remove path separators', () => {
      const result = sanitizeFilename('../../../etc/passwd');
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
      expect(result).not.toContain('..');
    });

    it('should remove leading dots', () => {
      const result = sanitizeFilename('...hidden.txt');
      expect(result).toBe('hidden.txt');
    });

    it('should replace special characters with underscores', () => {
      const result = sanitizeFilename('file@#$%name.pdf');
      expect(result).toBe('file____name.pdf');
    });

    it('should preserve alphanumeric, dash, underscore, and dot', () => {
      const result = sanitizeFilename('my-file_name.v1.0.pdf');
      expect(result).toBe('my-file_name.v1.0.pdf');
    });

    it('should return "file" for empty filename', () => {
      const result = sanitizeFilename('');
      expect(result).toBe('file');
    });

    it('should return "file" for filename with only special characters', () => {
      const result = sanitizeFilename('@#$%^&*()');
      expect(result).toBe('file');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate unique filename with UUID', () => {
      const result = generateUniqueFilename('document.pdf');
      expect(result).toMatch(/^[0-9a-f-]+_document\.pdf$/);
    });

    it('should sanitize original filename', () => {
      const result = generateUniqueFilename('../../../etc/passwd');
      expect(result).not.toContain('/');
      expect(result).not.toContain('..');
    });

    it('should preserve file extension', () => {
      const result = generateUniqueFilename('report.xlsx');
      expect(result).toMatch(/\.xlsx$/);
    });

    it('should generate different filenames for same input', () => {
      const result1 = generateUniqueFilename('document.pdf');
      const result2 = generateUniqueFilename('document.pdf');
      expect(result1).not.toBe(result2);
    });
  });

  describe('validateFileSize', () => {
    it('should not throw for valid file size', () => {
      expect(() => validateFileSize(5 * 1024 * 1024)).not.toThrow();
    });

    it('should throw ValidationError for file size exceeding maximum', () => {
      expect(() => validateFileSize(11 * 1024 * 1024)).toThrow(ValidationError);
      expect(() => validateFileSize(11 * 1024 * 1024)).toThrow(/exceeds maximum/);
    });

    it('should allow file size exactly at maximum', () => {
      expect(() => validateFileSize(MAX_FILE_SIZE)).not.toThrow();
    });
  });

  describe('validateFileType', () => {
    it('should not throw for allowed file type', () => {
      expect(() => validateFileType('application/pdf', ALLOWED_DOCUMENT_TYPES)).not.toThrow();
    });

    it('should throw ValidationError for disallowed file type', () => {
      expect(() => validateFileType('image/jpeg', ALLOWED_DOCUMENT_TYPES)).toThrow(ValidationError);
      expect(() => validateFileType('image/jpeg', ALLOWED_DOCUMENT_TYPES)).toThrow(/not allowed/);
    });

    it('should throw ValidationError for executable file type', () => {
      expect(() => validateFileType('application/x-msdownload', ALLOWED_DOCUMENT_TYPES)).toThrow(ValidationError);
    });
  });

  describe('validateFileExtension', () => {
    it('should not throw for matching extension and MIME type', () => {
      expect(() => validateFileExtension('document.pdf', 'application/pdf')).not.toThrow();
    });

    it('should throw ValidationError for mismatched extension and MIME type', () => {
      expect(() => validateFileExtension('document.pdf', 'application/msword')).toThrow(ValidationError);
      expect(() => validateFileExtension('document.pdf', 'application/msword')).toThrow(/does not match/);
    });

    it('should not throw for unknown extension', () => {
      expect(() => validateFileExtension('document.xyz', 'application/octet-stream')).not.toThrow();
    });

    it('should be case-insensitive for extension', () => {
      expect(() => validateFileExtension('document.PDF', 'application/pdf')).not.toThrow();
    });
  });

  describe('validateUploadedFile', () => {
    it('should throw ValidationError when no file is provided', () => {
      expect(() => validateUploadedFile(undefined, ALLOWED_DOCUMENT_TYPES)).toThrow(ValidationError);
      expect(() => validateUploadedFile(undefined, ALLOWED_DOCUMENT_TYPES)).toThrow(/No file uploaded/);
    });

    it('should not throw for valid file', () => {
      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 5 * 1024 * 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      expect(() => validateUploadedFile(file, ALLOWED_DOCUMENT_TYPES)).not.toThrow();
    });

    it('should throw ValidationError for file size exceeding maximum', () => {
      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 11 * 1024 * 1024,
        buffer: Buffer.alloc(11 * 1024 * 1024),
      } as Express.Multer.File;

      expect(() => validateUploadedFile(file, ALLOWED_DOCUMENT_TYPES)).toThrow(ValidationError);
      expect(() => validateUploadedFile(file, ALLOWED_DOCUMENT_TYPES)).toThrow(/exceeds maximum/);
    });

    it('should throw ValidationError for disallowed file type', () => {
      const file = {
        originalname: 'image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      expect(() => validateUploadedFile(file, ALLOWED_DOCUMENT_TYPES)).toThrow(ValidationError);
      expect(() => validateUploadedFile(file, ALLOWED_DOCUMENT_TYPES)).toThrow(/not allowed/);
    });

    it('should throw ValidationError for mismatched extension and MIME type', () => {
      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/msword',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      expect(() => validateUploadedFile(file, ALLOWED_DOCUMENT_TYPES)).toThrow(ValidationError);
      expect(() => validateUploadedFile(file, ALLOWED_DOCUMENT_TYPES)).toThrow(/does not match/);
    });
  });

  describe('getExtensionFromMimeType', () => {
    it('should return correct extension for PDF', () => {
      expect(getExtensionFromMimeType('application/pdf')).toBe('.pdf');
    });

    it('should return correct extension for Word document', () => {
      expect(getExtensionFromMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('.docx');
    });

    it('should return .bin for unknown MIME type', () => {
      expect(getExtensionFromMimeType('application/unknown')).toBe('.bin');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });
});
