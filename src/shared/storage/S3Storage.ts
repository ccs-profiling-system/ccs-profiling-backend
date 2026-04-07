import { randomUUID } from 'crypto';
import type { StorageProvider, UploadOptions, UploadResult } from './StorageProvider';

/**
 * AWS S3 Storage Provider
 * 
 * Implements file storage using AWS S3 or S3-compatible services.
 * Supports configuration via environment variables.
 * 
 * 
 * Required Environment Variables:
 * - AWS_S3_BUCKET: S3 bucket name
 * - AWS_S3_REGION: AWS region (e.g., 'us-east-1')
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - AWS_S3_ENDPOINT: (Optional) Custom S3 endpoint for S3-compatible services
 */
export class S3Storage implements StorageProvider {
  private s3Client: any; // AWS S3 client (lazy loaded)
  private bucket: string;
  private region: string;
  private endpoint?: string;

  /**
   * Create a new S3Storage instance
   * 
   * @param config - S3 configuration
   */
  constructor(config: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  }) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.endpoint = config.endpoint;

    // Lazy load AWS SDK to avoid requiring it when using local storage
    // This allows the application to run without AWS SDK installed in development
    this.initializeS3Client(config);
  }

  /**
   * Initialize S3 client (lazy loaded)
   */
  private initializeS3Client(config: {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  }): void {
    try {
      // Dynamic import to avoid requiring AWS SDK when not needed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3Client } = require('@aws-sdk/client-s3');

      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        ...(config.endpoint && { endpoint: config.endpoint }),
      });
    } catch (error) {
      throw new Error(
        'AWS SDK not installed. Run: npm install @aws-sdk/client-s3'
      );
    }
  }

  /**
   * Upload a file to S3
   * 
   * File naming convention: {timestamp}_{uuid}_{original_filename}
   * Directory structure: {entity_type}/{year}/{month}/
   * 
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    const { entityType, originalFilename, mimeType, buffer } = options;

    // Generate timestamp and UUID for filename
    const timestamp = Date.now();
    const uuid = randomUUID();
    const fileName = `${timestamp}_${uuid}_${originalFilename}`;

    // Organize by entity type, year, and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Build S3 key: {entity_type}/{year}/{month}/{filename}
    const key = `${entityType}/${year}/${month}/${fileName}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PutObjectCommand } = require('@aws-sdk/client-s3');

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);

      return {
        fileName,
        storagePath: key,
        fileSize: buffer.length,
      };
    } catch (error) {
      throw new Error(`Failed to upload file to S3: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a file from S3
   * 
   * @param storagePath - S3 key for the file
   */
  async delete(storagePath: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(`Failed to delete file from S3: ${(error as Error).message}`);
    }
  }

  /**
   * Get a publicly accessible URL for a file in S3
   * 
   * @param storagePath - S3 key for the file
   * @returns Public URL for the file
   */
  async getUrl(storagePath: string): Promise<string> {
    // For public buckets, construct the URL directly
    if (this.endpoint) {
      // Custom S3-compatible endpoint
      return `${this.endpoint}/${this.bucket}/${storagePath}`;
    }

    // Standard AWS S3 URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${storagePath}`;
  }

  /**
   * Get a pre-signed URL for private files (optional enhancement)
   * 
   * @param storagePath - S3 key for the file
   * @param expiresIn - URL expiration time in seconds (default: 3600)
   * @returns Pre-signed URL
   */
  async getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${(error as Error).message}`);
    }
  }
}
