/**
 * Dashboard Service
 * 
 * Provides aggregated statistics for the department chair dashboard.
 * All queries are department-scoped to ensure multi-tenant data isolation.
 * 
 */

import { db } from '../../../db';
import { students, faculty, schedules, events, research, researchAdvisers } from '../../../db/schema';
import { eq, and, isNull, gte, sql } from 'drizzle-orm';

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalSchedules: number;
  totalEvents: number;
  totalResearch: number;
  pendingStudentApprovals: number;
  pendingResearchApprovals: number;
  upcomingEvents: number;
  activeResearchProjects: number;
}

export class DashboardService {
  /**
   * Get aggregated dashboard statistics for a department
   * 
   * Queries multiple tables to provide an overview of:
   * - Total counts for students, faculty, schedules, events, research
   * - Pending approvals for students and research
   * - Upcoming events (next 30 days)
   * - Active research projects
   * 
   * If departmentId is empty, returns college-wide statistics (all departments).
   * 
   * @param departmentId - Department ID to scope the statistics (empty string for all)
   * @returns Aggregated dashboard statistics
   * 
   * @example
   * ```typescript
   * const stats = await dashboardService.getDashboardStats('Computer Science');
   * console.log(stats.totalStudents); // 150
   * console.log(stats.pendingStudentApprovals); // 5
   * ```
   */
  async getDashboardStats(departmentId: string): Promise<DashboardStats> {
    // Calculate date 30 days from now for upcoming events
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysFromNowStr = thirtyDaysFromNow.toISOString().split('T')[0];

    const today = new Date().toISOString().split('T')[0];

    // Query 1: Total students (active, not deleted)
    const studentConditions = [isNull(students.deleted_at)];
    if (departmentId) {
      studentConditions.push(eq(students.program, departmentId));
    }
    
    const totalStudentsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(...studentConditions));

    // Query 2: Total faculty (active, not deleted)
    const facultyConditions = [isNull(faculty.deleted_at)];
    if (departmentId) {
      facultyConditions.push(eq(faculty.department, departmentId));
    }
    
    const totalFacultyResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(faculty)
      .where(and(...facultyConditions));

    // Query 3: Total schedules (not deleted)
    const scheduleConditions = [
      isNull(schedules.deleted_at),
      isNull(faculty.deleted_at)
    ];
    if (departmentId) {
      scheduleConditions.push(eq(faculty.department, departmentId));
    }
    
    const totalSchedulesResult = await db
      .select({ count: sql<number>`count(distinct ${schedules.id})::int` })
      .from(schedules)
      .innerJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(and(...scheduleConditions));

    // Query 4: Total events (not deleted)
    const totalEventsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(isNull(events.deleted_at));

    // Query 5: Total research projects (not deleted)
    const researchConditions = [
      isNull(research.deleted_at),
      isNull(faculty.deleted_at)
    ];
    if (departmentId) {
      researchConditions.push(eq(faculty.department, departmentId));
    }
    
    const totalResearchResult = await db
      .select({ count: sql<number>`count(distinct ${research.id})::int` })
      .from(research)
      .innerJoin(researchAdvisers, eq(research.id, researchAdvisers.research_id))
      .innerJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(and(...researchConditions));

    // Query 6: Pending student approvals (status = 'pending_approval')
    const pendingStudentConditions = [
      eq(students.status, 'pending_approval'),
      isNull(students.deleted_at)
    ];
    if (departmentId) {
      pendingStudentConditions.push(eq(students.program, departmentId));
    }
    
    const pendingStudentsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(...pendingStudentConditions));

    // Query 7: Pending research approvals (status = 'pending_approval')
    const pendingResearchConditions = [
      eq(research.status, 'pending_approval'),
      isNull(research.deleted_at),
      isNull(faculty.deleted_at)
    ];
    if (departmentId) {
      pendingResearchConditions.push(eq(faculty.department, departmentId));
    }
    
    const pendingResearchResult = await db
      .select({ count: sql<number>`count(distinct ${research.id})::int` })
      .from(research)
      .innerJoin(researchAdvisers, eq(research.id, researchAdvisers.research_id))
      .innerJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(and(...pendingResearchConditions));

    // Query 8: Upcoming events (next 30 days, not deleted)
    const upcomingEventsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(
        and(
          gte(events.event_date, today),
          sql`${events.event_date} <= ${thirtyDaysFromNowStr}`,
          isNull(events.deleted_at)
        )
      );

    // Query 9: Active research projects (status = 'ongoing')
    const activeResearchConditions = [
      eq(research.status, 'ongoing'),
      isNull(research.deleted_at),
      isNull(faculty.deleted_at)
    ];
    if (departmentId) {
      activeResearchConditions.push(eq(faculty.department, departmentId));
    }
    
    const activeResearchResult = await db
      .select({ count: sql<number>`count(distinct ${research.id})::int` })
      .from(research)
      .innerJoin(researchAdvisers, eq(research.id, researchAdvisers.research_id))
      .innerJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(and(...activeResearchConditions));

    // Aggregate results
    return {
      totalStudents: totalStudentsResult[0]?.count || 0,
      totalFaculty: totalFacultyResult[0]?.count || 0,
      totalSchedules: totalSchedulesResult[0]?.count || 0,
      totalEvents: totalEventsResult[0]?.count || 0,
      totalResearch: totalResearchResult[0]?.count || 0,
      pendingStudentApprovals: pendingStudentsResult[0]?.count || 0,
      pendingResearchApprovals: pendingResearchResult[0]?.count || 0,
      upcomingEvents: upcomingEventsResult[0]?.count || 0,
      activeResearchProjects: activeResearchResult[0]?.count || 0,
    };
  }
}
