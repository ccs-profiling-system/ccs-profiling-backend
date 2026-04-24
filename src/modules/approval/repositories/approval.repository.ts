import { db } from '../../../db';
import { approvals, type Approval, type InsertApproval, ApprovalStatus } from '../../../db/schema/approvals';
import { eq, and, isNull, gte, lte, inArray, sql, desc, asc } from 'drizzle-orm';

/**
 * Filter options for querying approvals
 */
export interface ApprovalFilters {
  status?: string | string[];
  entity_type?: string;
  category?: string;
  submitter_id?: string;
  reviewer_id?: string;
  department_id?: string;
  submission_date_from?: Date;
  submission_date_to?: Date;
  decision_date_from?: Date;
  decision_date_to?: Date;
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
 * Approval Repository
 * 
 * Handles all database operations for the approvals table.
 * All queries exclude soft-deleted records by default.
 */
export class ApprovalRepository {
  /**
   * Create a new approval record
   * 
   * @param data - Approval data to insert
   * @returns Created approval record
   */
  async create(data: InsertApproval): Promise<Approval> {
    const [approval] = await db
      .insert(approvals)
      .values(data)
      .returning();
    
    return approval;
  }

  /**
   * Find an approval by ID
   * 
   * @param id - Approval ID
   * @returns Approval record or undefined if not found
   */
  async findById(id: string): Promise<Approval | undefined> {
    const approval = await db.query.approvals.findFirst({
      where: (approvals, { eq, and, isNull }) => 
        and(
          eq(approvals.id, id),
          isNull(approvals.deleted_at)
        ),
    });

    return approval;
  }

  /**
   * Find multiple approvals with filtering and pagination
   * 
   * @param filters - Filter criteria
   * @param pagination - Pagination options
   * @returns Paginated approval records
   */
  async findMany(
    filters: ApprovalFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<Approval>> {
    const page = pagination.page || 1;
    const pageSize = Math.min(pagination.pageSize || 20, 100); // Max 100 per page
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    const conditions = this.buildWhereConditions(filters);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(approvals)
      .where(conditions);

    // Get paginated data
    const data = await db
      .select()
      .from(approvals)
      .where(conditions)
      .orderBy(desc(approvals.submission_timestamp))
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
   * Update an approval record
   * 
   * @param id - Approval ID
   * @param data - Partial approval data to update
   * @returns Updated approval record or undefined if not found
   */
  async update(id: string, data: Partial<InsertApproval>): Promise<Approval | undefined> {
    const [approval] = await db
      .update(approvals)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(approvals.id, id),
          isNull(approvals.deleted_at)
        )
      )
      .returning();

    return approval;
  }

  /**
   * Soft delete an approval record
   * 
   * @param id - Approval ID
   * @returns True if deleted, false if not found
   */
  async softDelete(id: string): Promise<boolean> {
    const [approval] = await db
      .update(approvals)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(
        and(
          eq(approvals.id, id),
          isNull(approvals.deleted_at)
        )
      )
      .returning();

    return !!approval;
  }

  /**
   * Count approvals by status
   * 
   * @param filters - Optional additional filters
   * @returns Object with status counts
   */
  async countByStatus(filters: Omit<ApprovalFilters, 'status'> = {}): Promise<Record<string, number>> {
    const conditions = this.buildWhereConditions(filters);

    const results = await db
      .select({
        status: approvals.status,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(conditions)
      .groupBy(approvals.status);

    // Convert array to object
    const statusCounts: Record<string, number> = {};
    for (const result of results) {
      statusCounts[result.status] = result.count;
    }

    return statusCounts;
  }

  /**
   * Find pending approvals with filtering and pagination
   * 
   * @param filters - Filter criteria (status filter ignored, always pending)
   * @param pagination - Pagination options
   * @returns Paginated pending approval records
   */
  async findPending(
    filters: Omit<ApprovalFilters, 'status'> = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<Approval>> {
    return this.findMany(
      { ...filters, status: ApprovalStatus.PENDING },
      pagination
    );
  }

  /**
   * Find approval history (processed approvals) with filtering and pagination
   * 
   * @param filters - Filter criteria
   * @param pagination - Pagination options
   * @returns Paginated history records
   */
  async findHistory(
    filters: ApprovalFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<Approval>> {
    // History includes: approved, rejected, withdrawn, failed, conflicted
    const historyStatuses = [
      ApprovalStatus.APPROVED,
      ApprovalStatus.REJECTED,
      ApprovalStatus.WITHDRAWN,
      ApprovalStatus.FAILED,
      ApprovalStatus.CONFLICTED,
    ];

    return this.findMany(
      { ...filters, status: historyStatuses },
      pagination
    );
  }

  /**
   * Build WHERE conditions from filters
   * 
   * @param filters - Filter criteria
   * @returns SQL WHERE condition
   */
  private buildWhereConditions(filters: ApprovalFilters) {
    const conditions = [isNull(approvals.deleted_at)];

    // Status filter (single or multiple)
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(approvals.status, filters.status));
      } else {
        conditions.push(eq(approvals.status, filters.status));
      }
    }

    // Entity type filter
    if (filters.entity_type) {
      conditions.push(eq(approvals.entity_type, filters.entity_type));
    }

    // Category filter
    if (filters.category) {
      conditions.push(eq(approvals.category, filters.category));
    }

    // Submitter filter
    if (filters.submitter_id) {
      conditions.push(eq(approvals.submitter_id, filters.submitter_id));
    }

    // Reviewer filter
    if (filters.reviewer_id) {
      conditions.push(eq(approvals.reviewer_id, filters.reviewer_id));
    }

    // Department filter
    if (filters.department_id) {
      conditions.push(eq(approvals.department_id, filters.department_id));
    }

    // Submission date range
    if (filters.submission_date_from) {
      conditions.push(gte(approvals.submission_timestamp, filters.submission_date_from));
    }
    if (filters.submission_date_to) {
      conditions.push(lte(approvals.submission_timestamp, filters.submission_date_to));
    }

    // Decision date range
    if (filters.decision_date_from) {
      conditions.push(gte(approvals.decision_timestamp, filters.decision_date_from));
    }
    if (filters.decision_date_to) {
      conditions.push(lte(approvals.decision_timestamp, filters.decision_date_to));
    }

    return and(...conditions);
  }
}

// Export singleton instance
export const approvalRepository = new ApprovalRepository();
