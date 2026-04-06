# Storage Module

The storage module provides a flexible file storage abstraction that supports multiple storage backends (local filesystem and AWS S3).

## Features

- **Multiple Storage Backends**: Local filesystem and AWS S3
- **Consistent Interface**: Same API regardless of storage backend
- **Automatic Organization**: Files organized by entity type, year, and month
- **Unique Filenames**: Timestamp + UUID naming prevents conflicts
- **Environment-Based Configuration**: Easy switching between storage providers

## File Organization

Files are automatically organized using the following structure:

```
{entity_type}/{year}/{month}/{timestamp}_{uuid}_{original_filename}
```

Example:
```
student/2024/01/1704067200000_a1b2c3d4-e5f6-7890-abcd-ef1234567890_transcript.pdf
faculty/2024/01/1704067200000_b2c3d4e5-f6a7-8901-bcde-f12345678901_resume.pdf
research/2024/02/1706745600000_c3d4e5f6-a7b8-9012-cdef-123456789012_paper.pdf
```

## Usage

### Basic Usage

```typescript
import { StorageFactory } from '@/shared/storage';

// Get the configured storage provider
const storage = StorageFactory.getProvider();

// Upload a file
const result = await storage.upload({
  entityType: 'student',
  originalFilename: 'document.pdf',
  mimeType: 'application/pdf',
  buffer: fileBuffer,
});

console.log(result);
// {
//   fileName: '1704067200000_a1b2c3d4-e5f6-7890-abcd-ef1234567890_document.pdf',
//   storagePath: 'student/2024/01/1704067200000_a1b2c3d4-e5f6-7890-abcd-ef1234567890_document.pdf',
//   fileSize: 12345
// }

// Get file URL
const url = await storage.getUrl(result.storagePath);
console.log(url); // '/uploads/student/2024/01/...' (local) or 'https://...' (S3)

// Delete a file
await storage.delete(result.storagePath);
```

### With Express Multer

```typescript
import multer from 'multer';
import { StorageFactory } from '@/shared/storage';

// Use memory storage with multer
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), async (req, res) => {
  const storage = StorageFactory.getProvider();
  
  const result = await storage.upload({
    entityType: 'student',
    originalFilename: req.file.originalname,
    mimeType: req.file.mimetype,
    buffer: req.file.buffer,
  });
  
  res.json({ success: true, data: result });
});
```

## Configuration

### Local Storage (Development)

Set the following environment variables in `.env`:

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
```

The local storage provider will:
- Store files in the specified directory
- Create subdirectories automatically
- Return relative URLs for Express static middleware

### AWS S3 Storage (Production)

Set the following environment variables in `.env`:

```env
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

Optional for S3-compatible services (MinIO, DigitalOcean Spaces, etc.):

```env
AWS_S3_ENDPOINT=https://custom-s3-endpoint.com
```

### Installing AWS SDK (for S3 storage)

The AWS SDK is not included by default to keep the development environment lightweight. Install it when needed:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## API Reference

### StorageProvider Interface

```typescript
interface StorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(storagePath: string): Promise<void>;
  getUrl(storagePath: string): Promise<string>;
}
```

### UploadOptions

```typescript
interface UploadOptions {
  entityType: 'student' | 'faculty' | 'research' | 'event';
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}
```

### UploadResult

```typescript
interface UploadResult {
  fileName: string;        // Stored filename with timestamp and UUID
  storagePath: string;     // Full path to file in storage
  fileSize: number;        // File size in bytes
}
```

## Storage Providers

### LocalStorage

Stores files on the local filesystem.

**Pros:**
- No external dependencies
- Fast for development
- No additional costs

**Cons:**
- Not suitable for distributed systems
- Limited scalability
- Files lost if server is destroyed

### S3Storage

Stores files in AWS S3 or S3-compatible services.

**Pros:**
- Highly scalable
- Durable and reliable
- Works with distributed systems
- CDN integration available

**Cons:**
- Requires AWS SDK
- Additional costs
- Network latency

## Advanced Features

### Pre-signed URLs (S3 only)

For private files, generate temporary pre-signed URLs:

```typescript
import { S3Storage } from '@/shared/storage';

const storage = StorageFactory.getProvider() as S3Storage;

// Generate a URL that expires in 1 hour
const signedUrl = await storage.getSignedUrl(storagePath, 3600);
```

## Testing

For testing, you can reset the singleton instance:

```typescript
import { StorageFactory } from '@/shared/storage';

afterEach(() => {
  StorageFactory.reset();
});
```

## Requirements Mapping

- **Requirement 31.1**: Storage provider interface with upload, delete, getUrl methods
- **Requirement 31.2**: File naming convention: {timestamp}_{uuid}_{original_filename}
- **Requirement 31.3**: Directory organization: uploads/{entity_type}/{year}/{month}/
- **Requirement 31.8**: Support for cloud storage providers via environment variables
