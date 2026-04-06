import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import type { StorageProvider, UploadOptions, UploadResult } from './StorageProvider';

/**
 * Local Filesystem Storage Provider
 * 
 * Implements file storage using the local filesystem.
 * Organizes files by entity type, year, and month.
 * Uses naming convention: {timestamp}_{uuid}_{original_filename}
 * 
 * Requirements: 31.1, 31.2, 31.3
 */
export class LocalStorage implements StorageProvider {
  private baseDir: string;

  /**
   * Create a new LocalStorage instance
   * 
   * @param baseDir - Base directory for file storage (e.g., './uploads')
   */
  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Upload a file to local filesystem
   * 
   * File naming convention: {timestamp}_{uuid}_{original_filename}
   * Directory structure: uploads/{entity_type}/{year}/{month}/
   * 
   * Requirements: 31.1, 31.2, 31.3
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    const { entityType, originalFilename, buffer } = options;

    // Generate timestamp and UUID for filename
    const timestamp = Date.now();
    const uuid = randomUUID();
    const fileName = `${timestamp}_${uuid}_${originalFilename}`;

    // Organize by entity type, year, and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Build storage path: uploads/{entity_type}/{year}/{month}/
    const relativePath = join(entityType, String(year), month, fileName);
    const storagePath = join(this.baseDir, relativePath);

    // Ensure directory exists
    await fs.mkdir(dirname(storagePath), { recursive: true });

    // Write file to disk
    await fs.writeFile(storagePath, buffer);

    return {
      fileName,
      storagePath: relativePath, // Store relative path for portability
      fileSize: buffer.length,
    };
  }

  /**
   * Delete a file from local filesystem
   * 
   * @param storagePath - Relative path to the file
   */
  async delete(storagePath: string): Promise<void> {
    const fullPath = join(this.baseDir, storagePath);
    
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get URL for a file in local storage
   * 
   * For local storage, returns a relative path that can be served by Express static middleware
   * 
   * @param storagePath - Relative path to the file
   * @returns URL path for the file
   */
  async getUrl(storagePath: string): Promise<string> {
    // Return path that can be served by Express static middleware
    // Example: /uploads/student/2024/01/1234567890_uuid_file.pdf
    return `/uploads/${storagePath}`;
  }
}
