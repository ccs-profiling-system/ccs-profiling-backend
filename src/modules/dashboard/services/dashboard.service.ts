/**
 * Dashboard Service
 * Computes dashboard metrics on-demand from existing database records
 * 
 */

import { Database } from '../../../db';
import { students } from '../../../db/schema/students';
import { faculty } from '../../../db/schema/faculty';
import { events } from '../../../db/schema/events';
import { enrollments } from '../../../db/schema/enrollments';
import { isNull, count, sql } from 'drizzle-orm';
import {
  DashboardMetricsDTO,
  StudentStatsDTO,
  FacultyStatsDTO,
  EnrollmentStatsDTO,
  EventStatsDTO,
} from '../types/dtos';

export class DashboardService {
  constructor(private db: Database) {}

  /**
   * Get complete dashboard metrics
   * Computes all metrics on-demand without database storage
   */
  async getDashboardMetrics(): Promise<DashboardMetricsDTO> {
    // Fetch all metrics in parallel for optimal performance
    const [studentStats, facultyStats, enrollmentStats, eventStats] = await Promise.all([
      this.getStudentStats(),
      this.getFacultyStats(),
      this.getEnrollmentStats(),
      this.getEventStats(),
    ]);

    return {
      students: studentStats,
      faculty: facultyStats,
      enrollments: enrollmentStats,
      events: eventStats,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Get student statistics
   * Calculates total student count from students table
   */
  async getStudentStats(): Promise<StudentStatsDTO> {
    // Count total students (excluding soft-deleted)
    const totalResult = await this.db
      .select({ count: count() })
      .from(students)
      .where(isNull(students.deleted_at));

    const total = totalResult[0]?.count || 0;

    // Count students by status
    const statusCounts = await this.db
      .select({
        status: students.status,
        count: count(),
      })
      .from(students)
      .where(isNull(students.deleted_at))
      .groupBy(students.status);

    // Count students by program
    const programCounts = await this.db
      .select({
        program: students.program,
        count: count(),
      })
      .from(students)
      .where(isNull(students.deleted_at))
      .groupBy(students.program);

    // Count students by year level
    const yearLevelCounts = await this.db
      .select({
        year_level: students.year_level,
        count: count(),
      })
      .from(students)
      .where(isNull(students.deleted_at))
      .groupBy(students.year_level);

    // Build status counts
    const activeCount = statusCounts.find((s) => s.status === 'active')?.count || 0;
    const inactiveCount = statusCounts.find((s) => s.status === 'inactive')?.count || 0;
    const graduatedCount = statusCounts.find((s) => s.status === 'graduated')?.count || 0;

    // Build program distribution
    const studentsByProgram: Record<string, number> = {};
    programCounts.forEach((p) => {
      if (p.program) {
        studentsByProgram[p.program] = p.count;
      }
    });

    // Build year level distribution
    const studentsByYearLevel: Record<string, number> = {};
    yearLevelCounts.forEach((y) => {
      if (y.year_level !== null) {
        studentsByYearLevel[y.year_level.toString()] = y.count;
      }
    });

    return {
      total_students: total,
      active_students: activeCount,
      inactive_students: inactiveCount,
      graduated_students: graduatedCount,
      students_by_program: studentsByProgram,
      students_by_year_level: studentsByYearLevel,
    };
  }

  /**
   * Get faculty statistics
   * Calculates total faculty count from faculty table
   */
  async getFacultyStats(): Promise<FacultyStatsDTO> {
    // Count total faculty (excluding soft-deleted)
    const totalResult = await this.db
      .select({ count: count() })
      .from(faculty)
      .where(isNull(faculty.deleted_at));

    const total = totalResult[0]?.count || 0;

    // Count faculty by status
    const statusCounts = await this.db
      .select({
        status: faculty.status,
        count: count(),
      })
      .from(faculty)
      .where(isNull(faculty.deleted_at))
      .groupBy(faculty.status);

    // Count faculty by department
    const departmentCounts = await this.db
      .select({
        department: faculty.department,
        count: count(),
      })
      .from(faculty)
      .where(isNull(faculty.deleted_at))
      .groupBy(faculty.department);

    // Build status counts
    const activeCount = statusCounts.find((s) => s.status === 'active')?.count || 0;
    const inactiveCount = statusCounts.find((s) => s.status === 'inactive')?.count || 0;

    // Build department distribution
    const facultyByDepartment: Record<string, number> = {};
    departmentCounts.forEach((d) => {
      if (d.department) {
        facultyByDepartment[d.department] = d.count;
      }
    });

    return {
      total_faculty: total,
      active_faculty: activeCount,
      inactive_faculty: inactiveCount,
      faculty_by_department: facultyByDepartment,
    };
  }

  /**
   * Get enrollment statistics
   * Calculates enrollment statistics from enrollments table
   */
  async getEnrollmentStats(): Promise<EnrollmentStatsDTO> {
    // Count total enrollments
    const totalResult = await this.db
      .select({ count: count() })
      .from(enrollments);

    const total = totalResult[0]?.count || 0;

    // Count enrollments by status
    const statusCounts = await this.db
      .select({
        status: enrollments.enrollment_status,
        count: count(),
      })
      .from(enrollments)
      .groupBy(enrollments.enrollment_status);

    // Count enrollments by semester
    const semesterCounts = await this.db
      .select({
        semester: enrollments.semester,
        academic_year: enrollments.academic_year,
        count: count(),
      })
      .from(enrollments)
      .groupBy(enrollments.semester, enrollments.academic_year);

    // Build status distribution
    const enrollmentsByStatus: Record<string, number> = {};
    statusCounts.forEach((s) => {
      if (s.status) {
        enrollmentsByStatus[s.status] = s.count;
      }
    });

    // Build semester distribution
    const enrollmentsBySemester: Record<string, number> = {};
    semesterCounts.forEach((s) => {
      const key = `${s.semester} ${s.academic_year}`;
      enrollmentsBySemester[key] = s.count;
    });

    // Get current semester enrollments (most recent semester)
    const currentSemester = semesterCounts.length > 0 ? semesterCounts[semesterCounts.length - 1] : null;
    const currentSemesterEnrollments = currentSemester?.count || 0;

    return {
      total_enrollments: total,
      enrollments_by_status: enrollmentsByStatus,
      enrollments_by_semester: enrollmentsBySemester,
      current_semester_enrollments: currentSemesterEnrollments,
    };
  }

  /**
   * Get event statistics
   * Calculates total event count from events table
   */
  async getEventStats(): Promise<EventStatsDTO> {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // Count total events (excluding soft-deleted)
    const totalResult = await this.db
      .select({ count: count() })
      .from(events)
      .where(isNull(events.deleted_at));

    const total = totalResult[0]?.count || 0;

    // Count events by type
    const typeCounts = await this.db
      .select({
        type: events.event_type,
        count: count(),
      })
      .from(events)
      .where(isNull(events.deleted_at))
      .groupBy(events.event_type);

    // Count upcoming events (event_date >= today)
    const upcomingResult = await this.db
      .select({ count: count() })
      .from(events)
      .where(sql`${events.deleted_at} IS NULL AND ${events.event_date} >= ${today}`);

    const upcomingCount = upcomingResult[0]?.count || 0;

    // Count past events (event_date < today)
    const pastResult = await this.db
      .select({ count: count() })
      .from(events)
      .where(sql`${events.deleted_at} IS NULL AND ${events.event_date} < ${today}`);

    const pastCount = pastResult[0]?.count || 0;

    // Build type distribution
    const eventsByType: Record<string, number> = {};
    typeCounts.forEach((t) => {
      if (t.type) {
        eventsByType[t.type] = t.count;
      }
    });

    return {
      total_events: total,
      events_by_type: eventsByType,
      upcoming_events: upcomingCount,
      past_events: pastCount,
    };
  }
}
