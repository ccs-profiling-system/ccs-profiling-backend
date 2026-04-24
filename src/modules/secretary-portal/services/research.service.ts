/**
 * Research Service
 * Business logic for research management operations with approval workflow and file uploads
 * 
 * Requirements: 8.1-8.34, 17.8, 18.4, 18.9
 */

import { db } from '../../../db';
import { research, researchAuthors, uploads } from '../../../db/schema';
import { eq, and, isNull, ilike, sql, SQL, gte, lte } from 'drizzle-orm';
import { ResearchDTO, ResearchAuthorDTO, ResearchFileDTO, PaginationParams, PaginatedResponse, ApprovalStatus, ResearchType } from '../types';
import { buildPaginationMeta, applyPagination } from '../utils/pagination';
import { logCreate, logUpdate, logDelete, logSubmit, logUpload } from '../utils/auditLogger';
import { ValidationError } from '../../../shared/errors';
import { generateUniqueFilename, sanitizeFilename, validateFileSize, validateFileType, ALLOWED_RESEARCH_TYPES } from '../utils/fileUpload';
import path from 'path';
import fs from 'fs/promises';

/**
 * Filter options for research queries
 */
export interface ResearchFilters {
  research_type?: ResearchType;
  status?: ApprovalStatus;
  start_date?: string;
  end_date?: string;
}

/**
 * Storage path for research files
 * Files stored outside web root directory
 * 
 * Requirements: 18.5
 */
const RESEARCH_FILES_PATH = process.env.RESEARCH_FILES_PATH || path.join(process.cwd(), 'storage', 'research');

/**
 * Ensure research files directory exists
 */
async function ensureResearchFilesDirectory(): Promise<void> {
  try {
    await fs.mkdir(RESEARCH_FILES_PATH, { recursive: true, mode: 0o750 });
  } catch (error) {
    console.error('Failed to create research files directory:', error);
    throw new Error('Failed to initialize file storage');
  }
}

/**
 * Get all research projects with pagination, filtering, and search
 * 
 * @param pagination - Pagination parameters (page, limit)
 * @param filters - Filter options (research_type, status, date range)
 * @param search - Search term for title
 * @returns Paginated list of research projects
 * 
 * Requirements: 8.1, 8.28-8.30
 */
export async function getAllResearch(
  pagination: PaginationParams,
  filters?: ResearchFilters,
  search?: string
): Promise<PaginatedResponse<ResearchDTO>> {
  const { page = 1, limit = 10 } = pagination;
  
  // Build where clause
  const whereConditions: SQL[] = [isNull(research.deleted_at)];
  
  // Apply filters
  if (filters?.research_type) {
    whereConditions.push(eq(research.research_type, filters.research_type));
  }
  
  if (filters?.status) {
    whereConditions.push(eq(research.status, filters.status));
  }
  
  if (filters?.start_date) {
    whereConditions.push(gte(research.start_date, filters.start_date));
  }
  
  if (filters?.end_date) {
    whereConditions.push(lte(research.start_date, filters.end_date));
  }
  
  // Apply search
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(ilike(research.title, searchPattern));
  }
  
  const whereClause = and(...whereConditions);
  
  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(research)
    .where(whereClause);
  
  const total = countResult[0]?.count || 0;
  
  // Get paginated data
  const { limit: safeLimit, offset } = applyPagination(page, limit);
  
  const data = await db
    .select()
    .from(research)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset)
    .orderBy(research.created_at);
  
  // Build pagination metadata
  const meta = buildPaginationMeta(total, page, limit);
  
  return {
    data: data as ResearchDTO[],
    meta,
  };
}

/**
 * Get research project by ID
 * 
 * @param id - Research UUID
 * @returns Research record or null if not found
 * 
 * Requirements: 8.2
 */
export async function getResearchById(id: string): Promise<ResearchDTO | null> {
  const result = await db
    .select()
    .from(research)
    .where(and(eq(research.id, id), isNull(research.deleted_at)))
    .limit(1);
  
  return result[0] ? (result[0] as ResearchDTO) : null;
}

/**
 * Create a new research project
 * 
 * @param data - Research data
 * @param userId - ID of user creating the research
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Created research record
 * 
 * Requirements: 8.3, 8.15-8.19
 */
export async function createResearch(
  data: {
    title: string;
    research_type: ResearchType;
    start_date: string;
    completion_date?: string;
    description?: string;
    abstract?: string;
    keywords?: string;
    funding_source?: string;
    budget?: number;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ResearchDTO> {
  // Validate start_date is not in the past
  const startDate = new Date(data.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (startDate < today) {
    throw new ValidationError('Start date cannot be in the past');
  }
  
  // Validate completion_date is after start_date if provided
  if (data.completion_date) {
    const completionDate = new Date(data.completion_date);
    if (completionDate <= startDate) {
      throw new ValidationError('Completion date must be after start date');
    }
  }
  
  // Validate research_type enum
  const validResearchTypes: ResearchType[] = ['thesis', 'capstone', 'publication', 'grant'];
  if (!validResearchTypes.includes(data.research_type)) {
    throw new ValidationError(`Invalid research type. Must be one of: ${validResearchTypes.join(', ')}`);
  }
  
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Create research record with initial status 'draft'
    const [newResearch] = await tx
      .insert(research)
      .values({
        title: data.title,
        research_type: data.research_type,
        start_date: data.start_date,
        completion_date: data.completion_date || null,
        abstract: data.abstract || null,
        status: 'draft', // Initial status
      })
      .returning();
    
    return newResearch;
  });
  
  // Log the creation action
  await logCreate(
    userId,
    'research',
    result.id,
    result as Record<string, any>,
    ipAddress,
    userAgent
  );
  
  return result as ResearchDTO;
}


/**
 * Update a research project
 * 
 * @param id - Research UUID
 * @param data - Updated research data
 * @param userId - ID of user updating the research
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Updated research record
 * 
 * Requirements: 8.4, 8.15-8.18, 8.21, 17.8
 */
export async function updateResearch(
  id: string,
  data: {
    title?: string;
    research_type?: ResearchType;
    start_date?: string;
    completion_date?: string;
    abstract?: string;
    publication_url?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ResearchDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(research)
      .where(and(eq(research.id, id), isNull(research.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new ValidationError('Research not found');
    }
    
    const oldValues = existing[0];
    
    // Prevent updates to research with status 'approved' or 'rejected'
    if (oldValues.status === 'approved' || oldValues.status === 'rejected') {
      throw new ValidationError(`Cannot update research with status '${oldValues.status}'`);
    }
    
    // Validate completion_date is after start_date if both are provided
    if (data.completion_date && data.start_date) {
      const completionDate = new Date(data.completion_date);
      const startDate = new Date(data.start_date);
      if (completionDate <= startDate) {
        throw new ValidationError('Completion date must be after start date');
      }
    }
    
    // Validate research_type enum if provided
    if (data.research_type) {
      const validResearchTypes: ResearchType[] = ['thesis', 'capstone', 'publication', 'grant'];
      if (!validResearchTypes.includes(data.research_type)) {
        throw new ValidationError(`Invalid research type. Must be one of: ${validResearchTypes.join(', ')}`);
      }
    }
    
    // Filter out undefined values from data
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    
    // Update research record
    const [updated] = await tx
      .update(research)
      .set({
        ...updateData,
        updated_at: new Date(),
      })
      .where(eq(research.id, id))
      .returning();
    
    // Log the update action
    await logUpdate(
      userId,
      'research',
      id,
      oldValues as Record<string, any>,
      updated as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return updated;
  });
  
  return result as ResearchDTO;
}

/**
 * Delete a research project (soft delete)
 * 
 * @param id - Research UUID
 * @param userId - ID of user deleting the research
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Deleted research record
 * 
 * Requirements: 8.5, 8.31-8.33, 17.8
 */
export async function deleteResearch(
  id: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ResearchDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(research)
      .where(and(eq(research.id, id), isNull(research.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new ValidationError('Research not found');
    }
    
    const oldValues = existing[0];
    
    // Prevent deletion of research with status 'approved' or 'pending_approval'
    if (oldValues.status === 'approved' || oldValues.status === 'pending_approval') {
      throw new ValidationError(`Cannot delete research with status '${oldValues.status}'`);
    }
    
    // Get all associated files
    const associatedFiles = await tx
      .select()
      .from(uploads)
      .where(
        and(
          eq(uploads.entity_type, 'research'),
          eq(uploads.entity_id, id)
        )
      );
    
    // Delete files from storage
    for (const file of associatedFiles) {
      try {
        await fs.unlink(file.storage_path);
      } catch (error) {
        console.error(`Failed to delete file ${file.storage_path}:`, error);
        // Continue with deletion even if file removal fails
      }
    }
    
    // Delete file records from database (cascade delete will handle this)
    await tx
      .delete(uploads)
      .where(
        and(
          eq(uploads.entity_type, 'research'),
          eq(uploads.entity_id, id)
        )
      );
    
    // Perform soft delete only for 'draft' status
    const [deleted] = await tx
      .update(research)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(research.id, id))
      .returning();
    
    // Log the deletion action
    await logDelete(
      userId,
      'research',
      id,
      oldValues as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return deleted;
  });
  
  return result as ResearchDTO;
}

/**
 * Submit a research project for approval
 * 
 * Changes status from 'draft' to 'pending_approval'
 * 
 * @param id - Research UUID
 * @param userId - ID of user submitting the research
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Updated research record
 * 
 * Requirements: 8.6, 8.20, 17.8
 */
export async function submitResearch(
  id: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ResearchDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(research)
      .where(and(eq(research.id, id), isNull(research.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new ValidationError('Research not found');
    }
    
    const oldValues = existing[0];
    
    // Validate state transition: only 'draft' can be submitted
    if (oldValues.status !== 'draft') {
      throw new ValidationError(`Cannot submit research with status '${oldValues.status}'. Only draft research can be submitted.`);
    }
    
    // Change status from 'draft' to 'pending_approval'
    const [updated] = await tx
      .update(research)
      .set({
        status: 'pending_approval',
        updated_at: new Date(),
      })
      .where(eq(research.id, id))
      .returning();
    
    return updated;
  });
  
  // Log the submission action
  await logSubmit(
    userId,
    'research',
    id,
    ipAddress,
    userAgent
  );
  
  return result as ResearchDTO;
}

/**
 * Upload a file for a research project
 * 
 * @param id - Research UUID
 * @param file - Uploaded file (from multer)
 * @param userId - ID of user uploading the file
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Created file record
 * 
 * Requirements: 8.7, 8.22-8.27, 18.4, 18.9
 */
export async function uploadResearchFile(
  id: string,
  file: Express.Multer.File,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ResearchFileDTO> {
  // Validate research exists
  const researchRecord = await getResearchById(id);
  
  if (!researchRecord) {
    throw new ValidationError('Research not found');
  }
  
  // Validate file size
  validateFileSize(file.size);
  
  // Validate file type
  validateFileType(file.mimetype, ALLOWED_RESEARCH_TYPES);
  
  // Ensure research files directory exists
  await ensureResearchFilesDirectory();
  
  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(file.originalname);
  const storagePath = path.join(RESEARCH_FILES_PATH, uniqueFilename);
  
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Save file to storage
    await fs.writeFile(storagePath, file.buffer, { mode: 0o640 });
    
    // Create file record in database
    const [fileRecord] = await tx
      .insert(uploads)
      .values({
        file_name: uniqueFilename,
        original_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        storage_path: storagePath,
        entity_type: 'research',
        entity_id: id,
        uploaded_by: userId || null,
      })
      .returning();
    
    return fileRecord;
  });
  
  // Log the upload action
  await logUpload(
    userId,
    'research',
    id,
    {
      file_id: result.id,
      file_name: result.file_name,
      original_name: result.original_name,
      file_size: result.file_size,
    },
    ipAddress,
    userAgent
  );
  
  return result as ResearchFileDTO;
}

/**
 * Get all files for a research project
 * 
 * @param id - Research UUID
 * @returns List of research files
 * 
 * Requirements: 8.8
 */
export async function getResearchFiles(id: string): Promise<ResearchFileDTO[]> {
  // Validate research exists
  const researchRecord = await getResearchById(id);
  
  if (!researchRecord) {
    throw new ValidationError('Research not found');
  }
  
  // Get research files
  const files = await db
    .select()
    .from(uploads)
    .where(
      and(
        eq(uploads.entity_type, 'research'),
        eq(uploads.entity_id, id)
      )
    )
    .orderBy(uploads.created_at);
  
  return files as ResearchFileDTO[];
}

/**
 * Delete a research file
 * 
 * @param id - Research UUID
 * @param fileId - File UUID
 * @param userId - ID of user deleting the file
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Deleted file record
 * 
 * Requirements: 8.9, 18.9
 */
export async function deleteResearchFile(
  id: string,
  fileId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ResearchFileDTO> {
  // Validate research exists
  const researchRecord = await getResearchById(id);
  
  if (!researchRecord) {
    throw new ValidationError('Research not found');
  }
  
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Get file record
    const fileRecords = await tx
      .select()
      .from(uploads)
      .where(
        and(
          eq(uploads.id, fileId),
          eq(uploads.entity_type, 'research'),
          eq(uploads.entity_id, id)
        )
      )
      .limit(1);
    
    if (fileRecords.length === 0) {
      throw new ValidationError('File not found');
    }
    
    const fileRecord = fileRecords[0];
    
    // Delete file from storage
    try {
      await fs.unlink(fileRecord.storage_path);
    } catch (error) {
      console.error(`Failed to delete file ${fileRecord.storage_path}:`, error);
      // Continue with database deletion even if file removal fails
    }
    
    // Delete file record from database
    await tx
      .delete(uploads)
      .where(eq(uploads.id, fileId));
    
    return fileRecord;
  });
  
  // Log the deletion action
  await logDelete(
    userId,
    'research',
    fileId,
    result as Record<string, any>,
    ipAddress,
    userAgent
  );
  
  return result as ResearchFileDTO;
}

/**
 * Get research authors
 * 
 * @param id - Research UUID
 * @returns List of research authors
 * 
 * Requirements: 8.10
 */
export async function getResearchAuthors(id: string): Promise<ResearchAuthorDTO[]> {
  // Validate research exists
  const researchRecord = await getResearchById(id);
  
  if (!researchRecord) {
    throw new ValidationError('Research not found');
  }
  
  // Get research authors with student information
  const authors = await db
    .select({
      id: researchAuthors.id,
      research_id: researchAuthors.research_id,
      student_id: researchAuthors.student_id,
      author_order: researchAuthors.author_order,
      created_at: researchAuthors.created_at,
      updated_at: researchAuthors.updated_at,
    })
    .from(researchAuthors)
    .where(eq(researchAuthors.research_id, id))
    .orderBy(researchAuthors.author_order);
  
  return authors as ResearchAuthorDTO[];
}
