/**
 * Storage Module Exports
 * 
 * Provides file storage abstraction with support for multiple backends.
 * 
 * Usage:
 * ```typescript
 * import { StorageFactory } from '@/shared/storage';
 * 
 * const storage = StorageFactory.getProvider();
 * const result = await storage.upload({
 *   entityType: 'student',
 *   originalFilename: 'document.pdf',
 *   mimeType: 'application/pdf',
 *   buffer: fileBuffer,
 * });
 * ```
 */

export { StorageProvider, UploadOptions, UploadResult } from './StorageProvider';
export { LocalStorage } from './LocalStorage';
export { S3Storage } from './S3Storage';
export { StorageFactory } from './StorageFactory';
