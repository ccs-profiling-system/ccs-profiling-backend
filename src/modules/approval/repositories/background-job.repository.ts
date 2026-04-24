import { db } from '../../../db';
import { 
  backgroundJobs, 
  type BackgroundJob, 
  type InsertBackgroundJob,
  JobStatus,
} from '../../../db/schema/backgroundJobs';
import { eq, and, inArray, sql, asc } from 'drizzle-orm';

/**
 * Filter options for querying background jobs
 */
export interface BackgroundJobFilters {
  status?: string | string[];
  job_type?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Background Job Repository
 * 
 * Handles all database operations for the background_jobs table.
 * Supports job queue processing with FIFO ordering.
 * 
 * Requirements: 34.1-34.10
 */
export class BackgroundJobRepository {
  /**
   * Create a new background job record
   * 
   * @param data - Background job data to insert
   * @returns Created background job record
   */
  async create(data: InsertBackgroundJob): Promise<BackgroundJob> {
    const [job] = await db
      .insert(backgroundJobs)
      .values(data)
      .returning();
    
    return job;
  }

  /**
   * Find a background job by ID
   * 
   * @param id - Background job ID
   * @returns Background job record or undefined if not found
   */
  async findById(id: string): Promise<BackgroundJob | undefined> {
    const job = await db.query.backgroundJobs.findFirst({
      where: (backgroundJobs, { eq }) => eq(backgroundJobs.id, id),
    });

    return job;
  }

  /**
   * Update the status of a background job
   * 
   * @param id - Background job ID
   * @param status - New status
   * @param additionalData - Optional additional fields to update (result, error, timestamps)
   * @returns Updated background job record or undefined if not found
   */
  async updateStatus(
    id: string, 
    status: string,
    additionalData?: {
      result?: Record<string, any>;
      error?: string;
      started_at?: Date;
      completed_at?: Date;
    }
  ): Promise<BackgroundJob | undefined> {
    const [job] = await db
      .update(backgroundJobs)
      .set({
        status,
        ...additionalData,
        updated_at: new Date(),
      })
      .where(eq(backgroundJobs.id, id))
      .returning();

    return job;
  }

  /**
   * Find queued jobs with optional filtering and pagination
   * Ordered by created_at ASC (FIFO - First In First Out)
   * 
   * @param filters - Optional filter criteria
   * @param pagination - Pagination options
   * @returns Paginated queued job records
   */
  async findQueued(
    filters: Omit<BackgroundJobFilters, 'status'> = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<BackgroundJob>> {
    const page = pagination.page || 1;
    const pageSize = Math.min(pagination.pageSize || 20, 100); // Max 100 per page
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions (always filter by queued status)
    const conditions = this.buildWhereConditions({ 
      ...filters, 
      status: JobStatus.QUEUED 
    });

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(backgroundJobs)
      .where(conditions);

    // Get paginated data ordered by created_at ASC (FIFO)
    const data = await db
      .select()
      .from(backgroundJobs)
      .where(conditions)
      .orderBy(asc(backgroundJobs.created_at))
      .limit(pageSize)
      .offset(offset);

    return {
      data,
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  }

  /**
   * Increment the retry count for a background job
   * 
   * @param id - Background job ID
   * @returns Updated background job record or undefined if not found
   */
  async incrementRetryCount(id: string): Promise<BackgroundJob | undefined> {
    const [job] = await db
      .update(backgroundJobs)
      .set({
        retry_count: sql`${backgroundJobs.retry_count} + 1`,
        updated_at: new Date(),
      })
      .where(eq(backgroundJobs.id, id))
      .returning();

    return job;
  }

  /**
   * Find multiple background jobs with filtering and pagination
   * 
   * @param filters - Filter criteria
   * @param pagination - Pagination options
   * @returns Paginated background job records
   */
  async findMany(
    filters: BackgroundJobFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<BackgroundJob>> {
    const page = pagination.page || 1;
    const pageSize = Math.min(pagination.pageSize || 20, 100); // Max 100 per page
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    const conditions = this.buildWhereConditions(filters);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(backgroundJobs)
      .where(conditions);

    // Get paginated data ordered by created_at DESC (most recent first)
    const data = await db
      .select()
      .from(backgroundJobs)
      .where(conditions)
      .orderBy(asc(backgroundJobs.created_at))
      .limit(pageSize)
      .offset(offset);

    return {
      data,
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  }

  /**
   * Build WHERE conditions from filters
   * 
   * @param filters - Filter criteria
   * @returns SQL WHERE condition
   */
  private buildWhereConditions(filters: BackgroundJobFilters) {
    const conditions = [];

    // Status filter (single or multiple)
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(backgroundJobs.status, filters.status));
      } else {
        conditions.push(eq(backgroundJobs.status, filters.status));
      }
    }

    // Job type filter
    if (filters.job_type) {
      conditions.push(eq(backgroundJobs.job_type, filters.job_type));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}

// Export singleton instance
export const backgroundJobRepository = new BackgroundJobRepository();
