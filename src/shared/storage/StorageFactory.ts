import type { StorageProvider } from './StorageProvider';
import { LocalStorage } from './LocalStorage';
import { S3Storage } from './S3Storage';

/**
 * Storage Provider Factory
 * 
 * Creates the appropriate storage provider based on environment configuration.
 * Supports local filesystem and AWS S3 storage.
 * 
 * Requirements: 31.8
 * 
 * Environment Variables:
 * - STORAGE_PROVIDER: 'local' or 's3' (default: 'local')
 * - LOCAL_STORAGE_PATH: Base directory for local storage (default: './uploads')
 * - AWS_S3_BUCKET: S3 bucket name (required for S3)
 * - AWS_S3_REGION: AWS region (required for S3)
 * - AWS_ACCESS_KEY_ID: AWS access key (required for S3)
 * - AWS_SECRET_ACCESS_KEY: AWS secret key (required for S3)
 * - AWS_S3_ENDPOINT: Custom S3 endpoint (optional)
 */
export class StorageFactory {
  private static instance: StorageProvider | null = null;

  /**
   * Get the configured storage provider instance (singleton)
   * 
   * @returns StorageProvider instance
   */
  static getProvider(): StorageProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  /**
   * Create a storage provider based on environment configuration
   * 
   * @returns StorageProvider instance
   */
  private static createProvider(): StorageProvider {
    const provider = process.env.STORAGE_PROVIDER || 'local';

    switch (provider.toLowerCase()) {
      case 'local':
        return this.createLocalStorage();

      case 's3':
        return this.createS3Storage();

      default:
        throw new Error(
          `Unknown storage provider: ${provider}. Supported providers: 'local', 's3'`
        );
    }
  }

  /**
   * Create a local filesystem storage provider
   * 
   * @returns LocalStorage instance
   */
  private static createLocalStorage(): LocalStorage {
    const baseDir = process.env.LOCAL_STORAGE_PATH || './uploads';
    return new LocalStorage(baseDir);
  }

  /**
   * Create an S3 storage provider
   * 
   * @returns S3Storage instance
   */
  private static createS3Storage(): S3Storage {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_S3_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const endpoint = process.env.AWS_S3_ENDPOINT;

    // Validate required S3 configuration
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required for S3 storage');
    }
    if (!region) {
      throw new Error('AWS_S3_REGION environment variable is required for S3 storage');
    }
    if (!accessKeyId) {
      throw new Error('AWS_ACCESS_KEY_ID environment variable is required for S3 storage');
    }
    if (!secretAccessKey) {
      throw new Error(
        'AWS_SECRET_ACCESS_KEY environment variable is required for S3 storage'
      );
    }

    return new S3Storage({
      bucket,
      region,
      accessKeyId,
      secretAccessKey,
      endpoint,
    });
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
