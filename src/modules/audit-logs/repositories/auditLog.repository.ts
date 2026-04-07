/**
 * Audit Log Repository
 * Database access layer for audit log operations
 * 
 */

import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { auditLogs } from '../../../db/schema';
import { AuditLogFilters } from '../types';

export interface CreateAuditLogData {
  user_id?: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export class AuditLogRepository {
  constructor(private db: Database) {}

  /**
   * Create a new audit log entry
   */
  async create(data: CreateAuditLogData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(auditLogs).values(data).returning();

    return result[0];
  }

  /**
   * Find audit log by ID
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find audit logs by user ID
   */
  async findByUserId(userId: string, filters?: AuditLogFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100);
    const offset = (page - 1) * limit;

    const conditions = [eq(auditLogs.user_id, userId)];

    // Apply date range filters
    if (filters?.start_date) {
      conditions.push(gte(auditLogs.created_at, new Date(filters.start_date)));
    }
    if (filters?.end_date) {
      conditions.push(lte(auditLogs.created_at, new Date(filters.end_date)));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${auditLogs.created_at} DESC`);

    return {
      data: results,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find audit logs by entity type and ID
   */
  async findByEntity(entityType: string, entityId: string, filters?: AuditLogFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100);
    const offset = (page - 1) * limit;

    const conditions = [
      eq(auditLogs.entity_type, entityType),
      eq(auditLogs.entity_id, entityId),
    ];

    // Apply date range filters
    if (filters?.start_date) {
      conditions.push(gte(auditLogs.created_at, new Date(filters.start_date)));
    }
    if (filters?.end_date) {
      conditions.push(lte(auditLogs.created_at, new Date(filters.end_date)));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${auditLogs.created_at} DESC`);

    return {
      data: results,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find audit logs by date range with filters
   */
  async findByDateRange(filters: AuditLogFilters) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const offset = (page - 1) * limit;

    const conditions = [];

    // Apply date range filters
    if (filters.start_date) {
      conditions.push(gte(auditLogs.created_at, new Date(filters.start_date)));
    }
    if (filters.end_date) {
      conditions.push(lte(auditLogs.created_at, new Date(filters.end_date)));
    }

    // Apply optional filters
    if (filters.user_id) {
      conditions.push(eq(auditLogs.user_id, filters.user_id));
    }
    if (filters.entity_type) {
      conditions.push(eq(auditLogs.entity_type, filters.entity_type));
    }
    if (filters.entity_id) {
      conditions.push(eq(auditLogs.entity_id, filters.entity_id));
    }
    if (filters.action_type) {
      conditions.push(eq(auditLogs.action_type, filters.action_type));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${auditLogs.created_at} DESC`);

    return {
      data: results,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
