import { db } from '../../../db';
import { approvals, ApprovalStatus, EntityType, Category } from '../../../db/schema/approvals';
import { eq, and, isNull, sql, gte, inArray } from 'drizzle-orm';
import { getDepartmentScopeAliases } from '../utils/departmentScope';

/**
 * Secretary Statistics Response
 */
export interface SecretaryStats {
  totalSubmissions: number;
  countsByStatus: Record<string, number>;
  approvalRate: number;
  rejectionRate: number;
  countsByEntityType: Record<string, number>;
  countsByCategory: Record<string, number>;
}

/**
 * Admin Statistics Response
 */
export interface AdminStats {
  totalApprovals: number;
  countsByStatus: Record<string, number>;
  approvalRate: number;
  rejectionRate: number;
  averageApprovalTimeHours: number;
  countsByEntityType: Record<string, number>;
  countsByCategory: Record<string, number>;
  pendingOlderThan24Hours: number;
  pendingOlderThan7Days: number;
}

/**
 * Chair Statistics Response
 */
export interface ChairStats {
  totalApprovals: number;
  countsByStatus: Record<string, number>;
  approvalRate: number;
  rejectionRate: number;
  averageApprovalTimeHours: number;
  countsByEntityType: Record<string, number>;
  countsByCategory: Record<string, number>;
  pendingOlderThan24Hours: number;
  pendingOlderThan7Days: number;
}

/**
 * Approval Statistics Service
 * 
 * Provides statistical analysis for approval workflow data.
 * Supports secretary, admin, and chair-scoped statistics.
 */
export class ApprovalStatisticsService {
  /**
   * Get statistics for a secretary's submissions
   * 
   * @param userId - Secretary user ID
   * @returns Secretary statistics
   */
  async getSecretaryStats(userId: string): Promise<SecretaryStats> {
    // Get counts by status
    const statusResults = await db
      .select({
        status: approvals.status,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          eq(approvals.submitter_id, userId),
          isNull(approvals.deleted_at)
        )
      )
      .groupBy(approvals.status);

    const countsByStatus: Record<string, number> = {};
    let totalSubmissions = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const result of statusResults) {
      countsByStatus[result.status] = result.count;
      totalSubmissions += result.count;
      
      if (result.status === ApprovalStatus.APPROVED) {
        approvedCount = result.count;
      } else if (result.status === ApprovalStatus.REJECTED) {
        rejectedCount = result.count;
      }
    }

    // Calculate approval and rejection rates
    const processedCount = approvedCount + rejectedCount;
    const approvalRate = processedCount > 0 ? (approvedCount / processedCount) * 100 : 0;
    const rejectionRate = processedCount > 0 ? (rejectedCount / processedCount) * 100 : 0;

    // Get counts by entity type
    const entityTypeResults = await db
      .select({
        entity_type: approvals.entity_type,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          eq(approvals.submitter_id, userId),
          isNull(approvals.deleted_at)
        )
      )
      .groupBy(approvals.entity_type);

    const countsByEntityType: Record<string, number> = {};
    for (const result of entityTypeResults) {
      countsByEntityType[result.entity_type] = result.count;
    }

    // Get counts by category
    const categoryResults = await db
      .select({
        category: approvals.category,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          eq(approvals.submitter_id, userId),
          isNull(approvals.deleted_at)
        )
      )
      .groupBy(approvals.category);

    const countsByCategory: Record<string, number> = {};
    for (const result of categoryResults) {
      countsByCategory[result.category] = result.count;
    }

    return {
      totalSubmissions,
      countsByStatus,
      approvalRate: Math.round(approvalRate * 100) / 100, // Round to 2 decimal places
      rejectionRate: Math.round(rejectionRate * 100) / 100,
      countsByEntityType,
      countsByCategory,
    };
  }

  /**
   * Get system-wide statistics for admins
   * 
   * @returns Admin statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    // Get counts by status
    const statusResults = await db
      .select({
        status: approvals.status,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(isNull(approvals.deleted_at))
      .groupBy(approvals.status);

    const countsByStatus: Record<string, number> = {};
    let totalApprovals = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const result of statusResults) {
      countsByStatus[result.status] = result.count;
      totalApprovals += result.count;
      
      if (result.status === ApprovalStatus.APPROVED) {
        approvedCount = result.count;
      } else if (result.status === ApprovalStatus.REJECTED) {
        rejectedCount = result.count;
      }
    }

    // Calculate approval and rejection rates
    const processedCount = approvedCount + rejectedCount;
    const approvalRate = processedCount > 0 ? (approvedCount / processedCount) * 100 : 0;
    const rejectionRate = processedCount > 0 ? (rejectedCount / processedCount) * 100 : 0;

    // Calculate average approval time
    const avgTimeResult = await db
      .select({
        avgHours: sql<number>`
          COALESCE(
            AVG(
              EXTRACT(EPOCH FROM (decision_timestamp - submission_timestamp)) / 3600
            )::numeric,
            0
          )
        `,
      })
      .from(approvals)
      .where(
        and(
          inArray(approvals.status, [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
          isNull(approvals.deleted_at)
        )
      );

    const averageApprovalTimeHours = avgTimeResult[0]?.avgHours 
      ? Math.round(Number(avgTimeResult[0].avgHours) * 100) / 100 
      : 0;

    // Get counts by entity type
    const entityTypeResults = await db
      .select({
        entity_type: approvals.entity_type,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(isNull(approvals.deleted_at))
      .groupBy(approvals.entity_type);

    const countsByEntityType: Record<string, number> = {};
    for (const result of entityTypeResults) {
      countsByEntityType[result.entity_type] = result.count;
    }

    // Get counts by category
    const categoryResults = await db
      .select({
        category: approvals.category,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(isNull(approvals.deleted_at))
      .groupBy(approvals.category);

    const countsByCategory: Record<string, number> = {};
    for (const result of categoryResults) {
      countsByCategory[result.category] = result.count;
    }

    // Count pending older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ count: pending24h }] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          eq(approvals.status, ApprovalStatus.PENDING),
          isNull(approvals.deleted_at),
          sql`${approvals.submission_timestamp} < ${twentyFourHoursAgo}`
        )
      );

    // Count pending older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [{ count: pending7d }] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          eq(approvals.status, ApprovalStatus.PENDING),
          isNull(approvals.deleted_at),
          sql`${approvals.submission_timestamp} < ${sevenDaysAgo}`
        )
      );

    return {
      totalApprovals,
      countsByStatus,
      approvalRate: Math.round(approvalRate * 100) / 100,
      rejectionRate: Math.round(rejectionRate * 100) / 100,
      averageApprovalTimeHours,
      countsByEntityType,
      countsByCategory,
      pendingOlderThan24Hours: pending24h,
      pendingOlderThan7Days: pending7d,
    };
  }

  /**
   * Get department-scoped statistics for chairs
   * 
   * @param departmentId - Department ID
   * @returns Chair statistics
   */
  async getChairStats(departmentId: string): Promise<ChairStats> {
    const departmentScopeAliases = getDepartmentScopeAliases(departmentId);

    // Get counts by status
    const statusResults = await db
      .select({
        status: approvals.status,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          inArray(approvals.department_id, departmentScopeAliases),
          isNull(approvals.deleted_at)
        )
      )
      .groupBy(approvals.status);

    const countsByStatus: Record<string, number> = {};
    let totalApprovals = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const result of statusResults) {
      countsByStatus[result.status] = result.count;
      totalApprovals += result.count;
      
      if (result.status === ApprovalStatus.APPROVED) {
        approvedCount = result.count;
      } else if (result.status === ApprovalStatus.REJECTED) {
        rejectedCount = result.count;
      }
    }

    // Calculate approval and rejection rates
    const processedCount = approvedCount + rejectedCount;
    const approvalRate = processedCount > 0 ? (approvedCount / processedCount) * 100 : 0;
    const rejectionRate = processedCount > 0 ? (rejectedCount / processedCount) * 100 : 0;

    // Calculate average approval time
    const avgTimeResult = await db
      .select({
        avgHours: sql<number>`
          COALESCE(
            AVG(
              EXTRACT(EPOCH FROM (decision_timestamp - submission_timestamp)) / 3600
            )::numeric,
            0
          )
        `,
      })
      .from(approvals)
      .where(
        and(
          inArray(approvals.department_id, departmentScopeAliases),
          inArray(approvals.status, [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
          isNull(approvals.deleted_at)
        )
      );

    const averageApprovalTimeHours = avgTimeResult[0]?.avgHours 
      ? Math.round(Number(avgTimeResult[0].avgHours) * 100) / 100 
      : 0;

    // Get counts by entity type
    const entityTypeResults = await db
      .select({
        entity_type: approvals.entity_type,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          inArray(approvals.department_id, departmentScopeAliases),
          isNull(approvals.deleted_at)
        )
      )
      .groupBy(approvals.entity_type);

    const countsByEntityType: Record<string, number> = {};
    for (const result of entityTypeResults) {
      countsByEntityType[result.entity_type] = result.count;
    }

    // Get counts by category
    const categoryResults = await db
      .select({
        category: approvals.category,
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          inArray(approvals.department_id, departmentScopeAliases),
          isNull(approvals.deleted_at)
        )
      )
      .groupBy(approvals.category);

    const countsByCategory: Record<string, number> = {};
    for (const result of categoryResults) {
      countsByCategory[result.category] = result.count;
    }

    // Count pending older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ count: pending24h }] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          inArray(approvals.department_id, departmentScopeAliases),
          eq(approvals.status, ApprovalStatus.PENDING),
          isNull(approvals.deleted_at),
          sql`${approvals.submission_timestamp} < ${twentyFourHoursAgo}`
        )
      );

    // Count pending older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [{ count: pending7d }] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(approvals)
      .where(
        and(
          inArray(approvals.department_id, departmentScopeAliases),
          eq(approvals.status, ApprovalStatus.PENDING),
          isNull(approvals.deleted_at),
          sql`${approvals.submission_timestamp} < ${sevenDaysAgo}`
        )
      );

    return {
      totalApprovals,
      countsByStatus,
      approvalRate: Math.round(approvalRate * 100) / 100,
      rejectionRate: Math.round(rejectionRate * 100) / 100,
      averageApprovalTimeHours,
      countsByEntityType,
      countsByCategory,
      pendingOlderThan24Hours: pending24h,
      pendingOlderThan7Days: pending7d,
    };
  }
}

// Export singleton instance
export const approvalStatisticsService = new ApprovalStatisticsService();
