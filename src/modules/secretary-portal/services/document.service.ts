/**
 * Document Service
 * Business logic for document management operations
 * 
 * Requirements: 6.1-6.22, 18.4-18.5, 18.9
 */

import { db } from '../../../db';
import { uploads } from '../../../db/schema';
import { eq, and, ilike, sql, SQL, gte, lte } from 'drizzle-orm';
import { DocumentDTO, PaginationParams, PaginatedResponse, DocumentCategory } from '../types';
import { buildPaginationMeta, applyPagination } from '../utils/pagination';
import { logUpload, logDelete } from '../utils/auditLogger';
import { StorageFactory } from '../../../shared/storage';
import {
  validateUploadedFile,
  sanitizeFilename,
  ALLOWED_DOCUMENT_TYPES,
} from '../utils/fileUpload';
import { ValidationError } from '../../../shared/errors';

/**
 * Filter options for document queries
 */
export interface DocumentFilters {
  category?: DocumentCategory;
  start_date?: string;
  end_date?: string;
}

/**
 * Document upload data
 */
export interface DocumentUploadData {
  title: string;
  category: DocumentCategory;
  description?: string;
}

/**
 * Upload a document with file
 * 
 * Note: The current implementation stores file metadata in the uploads table,
 * but does not persist document-specific metadata (title, category, description).
 * In production, this would require either:
 * 1. A separate documents table with a foreign key to uploads
 * 2. A JSON field in the uploads table for metadata
 * 
 * For now, we accept these fields in the API but only use them for audit logging.
 * The original_name field is used as the title when retrieving documents.
 * 
 * @param file - Uploaded file from multer
 * @param data - Document metadata (title, category, description)
 * @param userId - ID of user uploading the document
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Created document record
 * 
 * Requirements: 6.1, 6.9-6.16, 6.22, 18.4-18.5
 */
export async function uploadDocument(
  file: Express.Multer.File,
  data: DocumentUploadData,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<DocumentDTO> {
  // Validate file
  validateUploadedFile(file, ALLOWED_DOCUMENT_TYPES);

  // Sanitize filename to prevent path traversal attacks
  const sanitizedFilename = sanitizeFilename(file.originalname);

  // Get storage provider and upload file
  const storage = StorageFactory.getProvider();
  
  const uploadResult = await storage.upload({
    entityType: 'document',
    originalFilename: sanitizedFilename,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });

  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Create database record in uploads table
    const [document] = await tx
      .insert(uploads)
      .values({
        file_name: uploadResult.fileName,
        original_name: file.originalname,
        file_type: file.mimetype,
        file_size: uploadResult.fileSize,
        storage_path: uploadResult.storagePath,
        entity_type: 'document',
        entity_id: '', // Will be set to the upload ID after creation
        uploaded_by: userId || null,
      })
      .returning();

    // Update entity_id to point to itself (document ID = upload ID)
    const [updatedDocument] = await tx
      .update(uploads)
      .set({ entity_id: document.id })
      .where(eq(uploads.id, document.id))
      .returning();

    return updatedDocument;
  });

  // Log the upload action
  await logUpload(
    userId,
    'document',
    result.id,
    {
      title: data.title,
      category: data.category,
      description: data.description,
      original_name: file.originalname,
      file_type: file.mimetype,
      file_size: result.file_size,
    },
    ipAddress,
    userAgent
  );

  // Transform to DTO
  return {
    id: result.id,
    file_name: result.file_name,
    original_name: result.original_name,
    file_type: result.file_type,
    file_size: result.file_size,
    storage_path: result.storage_path,
    entity_type: result.entity_type,
    entity_id: result.entity_id,
    uploaded_by: result.uploaded_by,
    category: data.category,
    title: data.title,
    created_at: result.created_at,
    updated_at: result.updated_at,
  } as DocumentDTO;
}

/**
 * Get all documents with pagination, filtering, and search
 * 
 * @param pagination - Pagination parameters (page, limit)
 * @param filters - Filter options (category, start_date, end_date)
 * @param search - Search term for title
 * @returns Paginated list of documents
 * 
 * Requirements: 6.2, 6.17-6.19
 */
export async function getAllDocuments(
  pagination: PaginationParams,
  filters?: DocumentFilters,
  search?: string
): Promise<PaginatedResponse<DocumentDTO>> {
  const { page = 1, limit = 10 } = pagination;

  // Build where clause
  const whereConditions: SQL[] = [eq(uploads.entity_type, 'document')];

  // Apply filters
  if (filters?.category) {
    // Note: category is stored in metadata, not in uploads table
    // For now, we'll skip this filter until we have a proper documents table
    // or store category in a JSON field
  }

  if (filters?.start_date) {
    whereConditions.push(gte(uploads.created_at, new Date(filters.start_date)));
  }

  if (filters?.end_date) {
    // Add one day to include the entire end date
    const endDate = new Date(filters.end_date);
    endDate.setDate(endDate.getDate() + 1);
    whereConditions.push(lte(uploads.created_at, endDate));
  }

  // Apply search by original filename (title)
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(ilike(uploads.original_name, searchPattern));
  }

  const whereClause = and(...whereConditions);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(uploads)
    .where(whereClause);

  const total = countResult[0]?.count || 0;

  // Get paginated data
  const { limit: safeLimit, offset } = applyPagination(page, limit);

  const data = await db
    .select()
    .from(uploads)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset)
    .orderBy(uploads.created_at);

  // Build pagination metadata
  const meta = buildPaginationMeta(total, page, limit);

  // Transform to DTOs
  // Note: category and title are not stored in uploads table
  // We'll use original_name as title and default category
  const documents: DocumentDTO[] = data.map((doc) => ({
    id: doc.id,
    file_name: doc.file_name,
    original_name: doc.original_name,
    file_type: doc.file_type,
    file_size: doc.file_size,
    storage_path: doc.storage_path,
    entity_type: doc.entity_type,
    entity_id: doc.entity_id,
    uploaded_by: doc.uploaded_by,
    category: 'other' as DocumentCategory, // Default category
    title: doc.original_name, // Using original filename as title
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  }));

  return {
    data: documents,
    meta,
  };
}

/**
 * Get document by ID
 * 
 * @param id - Document UUID
 * @returns Document record or null if not found
 * 
 * Requirements: 6.3
 */
export async function getDocumentById(id: string): Promise<DocumentDTO | null> {
  const result = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, id), eq(uploads.entity_type, 'document')))
    .limit(1);

  if (!result[0]) {
    return null;
  }

  const doc = result[0];

  // Transform to DTO
  return {
    id: doc.id,
    file_name: doc.file_name,
    original_name: doc.original_name,
    file_type: doc.file_type,
    file_size: doc.file_size,
    storage_path: doc.storage_path,
    entity_type: doc.entity_type,
    entity_id: doc.entity_id,
    uploaded_by: doc.uploaded_by,
    category: 'other' as DocumentCategory, // Default category
    title: doc.original_name, // Using original filename as title
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  } as DocumentDTO;
}

/**
 * Download document
 * 
 * Returns the storage path for the document file
 * The controller will handle streaming the file to the client
 * 
 * @param id - Document UUID
 * @returns Document record with storage path
 * 
 * Requirements: 6.4
 */
export async function downloadDocument(id: string): Promise<DocumentDTO> {
  const document = await getDocumentById(id);

  if (!document) {
    throw new ValidationError('Document not found');
  }

  return document;
}

/**
 * Delete a document (hard delete)
 * 
 * Removes the file from storage and deletes the database record
 * 
 * @param id - Document UUID
 * @param userId - ID of user deleting the document
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Deleted document record
 * 
 * Requirements: 6.5, 6.20-6.22, 18.9
 */
export async function deleteDocument(
  id: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<DocumentDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(uploads)
      .where(and(eq(uploads.id, id), eq(uploads.entity_type, 'document')))
      .limit(1);

    if (existing.length === 0) {
      throw new ValidationError('Document not found');
    }

    const document = existing[0];

    // Delete file from storage
    const storage = StorageFactory.getProvider();
    await storage.delete(document.storage_path);

    // Hard delete database record (uploads table doesn't support soft delete)
    await tx.delete(uploads).where(eq(uploads.id, id));

    return document;
  });

  // Log the deletion action
  await logDelete(
    userId,
    'document',
    id,
    {
      original_name: result.original_name,
      file_type: result.file_type,
      file_size: result.file_size,
      storage_path: result.storage_path,
    },
    ipAddress,
    userAgent
  );

  // Transform to DTO
  return {
    id: result.id,
    file_name: result.file_name,
    original_name: result.original_name,
    file_type: result.file_type,
    file_size: result.file_size,
    storage_path: result.storage_path,
    entity_type: result.entity_type,
    entity_id: result.entity_id,
    uploaded_by: result.uploaded_by,
    category: 'other' as DocumentCategory, // Default category
    title: result.original_name, // Using original filename as title
    created_at: result.created_at,
    updated_at: result.updated_at,
  } as DocumentDTO;
}
