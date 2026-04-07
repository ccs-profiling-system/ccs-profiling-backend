/**
 * Report Repository
 * Database operations for report history
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, gte, lte, sql, count } from 'drizzle-orm';
import { reports } from '../../../db/schema';
import type { Report, NewReport } from '../../../db/schema';

export interface ReportFilters {
  report_type?: string;
  generated_by?: string;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

export interface ReportStatistics {
  total_reports: number;
  reports_this_month: number;
  most_generated_type: string;
  monthly_growth: number;
  total_size_bytes: number;
}

export class ReportRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async create(data: NewReport): Promise<Report> {
    const [report] = await this.db.insert(reports).values(data).returning();
    return report;
  }

  async findById(id: string): Promise<Report | undefined> {
    const [report] = await this.db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);
    return report;
  }

  async findAll(
    filters?: ReportFilters,
    page = 1,
    pageSize = 20
  ): Promise<{ data: Report[]; total: number }> {
    const conditions = [];

    if (filters?.report_type) {
      conditions.push(eq(reports.report_type, filters.report_type));
    }

    if (filters?.generated_by) {
      conditions.push(eq(reports.generated_by, filters.generated_by));
    }

    if (filters?.status) {
      conditions.push(eq(reports.status, filters.status));
    }

    if (filters?.start_date) {
      conditions.push(gte(reports.created_at, filters.start_date));
    }

    if (filters?.end_date) {
      conditions.push(lte(reports.created_at, filters.end_date));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(reports)
      .where(whereClause);

    const data = await this.db
      .select()
      .from(reports)
      .where(whereClause)
      .orderBy(desc(reports.created_at))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      data,
      total: totalResult.count,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(reports).where(eq(reports.id, id));
    return result.rowCount > 0;
  }

  async getStatistics(): Promise<ReportStatistics> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total reports
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(reports);

    // Reports this month
    const [thisMonthResult] = await this.db
      .select({ count: count() })
      .from(reports)
      .where(gte(reports.created_at, firstDayOfMonth));

    // Reports last month
    const [lastMonthResult] = await this.db
      .select({ count: count() })
      .from(reports)
      .where(
        and(
          gte(reports.created_at, firstDayOfLastMonth),
          lte(reports.created_at, lastDayOfLastMonth)
        )
      );

    // Most generated report type
    const mostGeneratedResult = await this.db
      .select({
        report_type: reports.report_type,
        count: count(),
      })
      .from(reports)
      .groupBy(reports.report_type)
      .orderBy(desc(count()))
      .limit(1);

    // Total file size
    const [sizeResult] = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${reports.file_size}), 0)`,
      })
      .from(reports);

    const thisMonthCount = thisMonthResult.count;
    const lastMonthCount = lastMonthResult.count;
    const monthlyGrowth =
      lastMonthCount > 0
        ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
        : 0;

    return {
      total_reports: totalResult.count,
      reports_this_month: thisMonthCount,
      most_generated_type: mostGeneratedResult[0]?.report_type || 'N/A',
      monthly_growth: Math.round(monthlyGrowth * 100) / 100,
      total_size_bytes: Number(sizeResult.total),
    };
  }
}
