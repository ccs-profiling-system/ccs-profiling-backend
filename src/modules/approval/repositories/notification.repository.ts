import { db } from '../../../db';
import { 
  approvalNotifications, 
  type ApprovalNotification, 
  type InsertApprovalNotification 
} from '../../../db/schema/approvalNotifications';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Filter options for querying notifications
 */
export interface NotificationFilters {
  read_status?: boolean;
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
 * Notification Repository
 * 
 * Handles all database operations for the approval_notifications table.
 * Queries are ordered by created_at DESC by default.
 * 
 * Requirements: 13.1-13.7
 */
export class NotificationRepository {
  /**
   * Create a new notification record
   * 
   * @param data - Notification data to insert
   * @returns Created notification record
   */
  async create(data: InsertApprovalNotification): Promise<ApprovalNotification> {
    const [notification] = await db
      .insert(approvalNotifications)
      .values(data)
      .returning();
    
    return notification;
  }

  /**
   * Find a notification by ID
   * 
   * @param id - Notification ID
   * @returns Notification record or undefined if not found
   */
  async findById(id: string): Promise<ApprovalNotification | undefined> {
    const notification = await db.query.approvalNotifications.findFirst({
      where: (approvalNotifications, { eq }) => eq(approvalNotifications.id, id),
    });

    return notification;
  }

  /**
   * Find notifications by user ID with filtering and pagination
   * 
   * @param userId - User ID
   * @param filters - Filter criteria
   * @param pagination - Pagination options
   * @returns Paginated notification records ordered by created_at DESC
   */
  async findByUserId(
    userId: string,
    filters: NotificationFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ApprovalNotification>> {
    const page = pagination.page || 1;
    const pageSize = Math.min(pagination.pageSize || 20, 100); // Max 100 per page
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    const conditions = this.buildWhereConditions(userId, filters);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(approvalNotifications)
      .where(conditions);

    // Get paginated data ordered by created_at DESC
    const data = await db
      .select()
      .from(approvalNotifications)
      .where(conditions)
      .orderBy(desc(approvalNotifications.created_at))
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
   * Mark a notification as read
   * 
   * @param id - Notification ID
   * @returns Updated notification record or undefined if not found
   */
  async markAsRead(id: string): Promise<ApprovalNotification | undefined> {
    const [notification] = await db
      .update(approvalNotifications)
      .set({
        read_status: true,
      })
      .where(eq(approvalNotifications.id, id))
      .returning();

    return notification;
  }

  /**
   * Count unread notifications for a user
   * 
   * @param userId - User ID
   * @returns Number of unread notifications
   */
  async countUnread(userId: string): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(approvalNotifications)
      .where(
        and(
          eq(approvalNotifications.user_id, userId),
          eq(approvalNotifications.read_status, false)
        )
      );

    return count;
  }

  /**
   * Build WHERE conditions from filters
   * 
   * @param userId - User ID
   * @param filters - Filter criteria
   * @returns SQL WHERE condition
   */
  private buildWhereConditions(userId: string, filters: NotificationFilters) {
    const conditions = [eq(approvalNotifications.user_id, userId)];

    // Read status filter
    if (filters.read_status !== undefined) {
      conditions.push(eq(approvalNotifications.read_status, filters.read_status));
    }

    return and(...conditions);
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository();
