/**
 * Storage Provider Interface
 * 
 * Defines the contract for file storage implementations.
 * Supports multiple storage backends (local filesystem, S3, etc.)
 * 
 */

export interface UploadOptions {
  entityType: 'student' | 'faculty' | 'research' | 'event';
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface UploadResult {
  fileName: string;        // Stored filename with timestamp and UUID
  storagePath: string;     // Full path to file in storage
  fileSize: number;        // File size in bytes
}

/**
 * StorageProvider interface
 * 
 * All storage implementations must implement this interface.
 */
export interface StorageProvider {
  /**
   * Upload a file to storage
   * 
   * @param options - Upload options including file data and metadata
   * @returns Promise resolving to upload result with storage path
   */
  upload(options: UploadOptions): Promise<UploadResult>;

  /**
   * Delete a file from storage
   * 
   * @param storagePath - Full path to the file in storage
   * @returns Promise resolving when deletion is complete
   */
  delete(storagePath: string): Promise<void>;

  /**
   * Get a publicly accessible URL for a file
   * 
   * @param storagePath - Full path to the file in storage
   * @returns Promise resolving to the file URL
   */
  getUrl(storagePath: string): Promise<string>;
}
