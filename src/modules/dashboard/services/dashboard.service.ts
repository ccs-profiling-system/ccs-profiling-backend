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
import { research } from '../../../db/schema/research';
import { auditLogs } from '../../../db/schema/auditLogs';
import { isNull, count, sql, desc, and } from 'drizzle-orm';
import {
  DashboardMetricsDTO,
  StudentStatsDTO,
  FacultyStatsDTO,
  EnrollmentStatsDTO,
  EventStatsDTO,
  RecentActivityDTO,
  PriorityAlertDTO,
  UpcomingEventDTO,
} from '../types/dtos';

export class DashboardService {
  constructor(private db: Database) {}

  /**
   * Get complete dashboard metrics
   * Computes all metrics on-demand without database storage
   */
  async getDashboardMetrics(): Promise<DashboardMetricsDTO> {
    // Fetch all metrics in parallel for optimal performance
    const [studentStats, facultyStats, enrollmentStats, eventStats, researchCount] = await Promise.all([
      this.getStudentStats(),
      this.getFacultyStats(),
      this.getEnrollmentStats(),
      this.getEventStats(),
      this.getResearchCount(),
    ]);

    return {
      students: studentStats,
      faculty: facultyStats,
      enrollments: enrollmentStats,
      events: eventStats,
      research: { total_research: researchCount },
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

  /**
   * Get recent activity from audit logs
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivityDTO[]> {
    const activities = await this.db
      .select({
        id: auditLogs.id,
        action_type: auditLogs.action_type,
        entity_type: auditLogs.entity_type,
        entity_id: auditLogs.entity_id,
        user_id: auditLogs.user_id,
        created_at: auditLogs.created_at,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.created_at))
      .limit(limit);

    return activities.map((activity) => {
      // Determine activity type based on entity_type
      let type: 'student' | 'faculty' | 'event' | 'research' | 'report' = 'report';
      if (activity.entity_type === 'student') type = 'student';
      else if (activity.entity_type === 'faculty') type = 'faculty';
      else if (activity.entity_type === 'event') type = 'event';
      else if (activity.entity_type === 'research') type = 'research';

      // Generate description based on action type
      let description = '';
      const actionMap: Record<string, string> = {
        create: 'created',
        update: 'updated',
        delete: 'deleted',
        restore: 'restored',
      };
      const action = actionMap[activity.action_type] || activity.action_type;
      description = `${activity.entity_type} ${action}`;

      return {
        id: activity.id,
        type,
        title: `${activity.entity_type.charAt(0).toUpperCase() + activity.entity_type.slice(1)} ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        description,
        timestamp: activity.created_at.toISOString(),
        userId: activity.user_id || undefined,
      };
    });
  }

  /**
   * Get priority alerts
   */
  async getPriorityAlerts(limit: number = 5): Promise<PriorityAlertDTO[]> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    // Get upcoming events as alerts
    const upcomingEvents = await this.db
      .select({
        id: events.id,
        event_name: events.event_name,
        event_date: events.event_date,
        event_type: events.event_type,
      })
      .from(events)
      .where(
        and(
          isNull(events.deleted_at),
          sql`${events.event_date} >= ${todayStr}`,
          sql`${events.event_date} <= ${nextWeekStr}`
        )
      )
      .orderBy(events.event_date)
      .limit(limit);

    return upcomingEvents.map((event) => {
      const eventDateValue = event.event_date;
      const eventDate = typeof eventDateValue === 'string' 
        ? eventDateValue 
        : (eventDateValue as Date).toISOString().split('T')[0];
      
      const isToday = eventDate === todayStr;
      const isTomorrow = eventDate === tomorrowStr;

      return {
        id: event.id,
        type: isToday || isTomorrow ? 'urgent' : 'important',
        title: event.event_name,
        description: `${event.event_type} scheduled for ${eventDate}`,
        actionUrl: `/events/${event.id}`,
        dueDate: eventDate,
        createdAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 5): Promise<UpcomingEventDTO[]> {
    const today = new Date().toISOString().split('T')[0];

    const upcomingEvents = await this.db
      .select({
        id: events.id,
        event_name: events.event_name,
        description: events.description,
        event_date: events.event_date,
        start_time: events.start_time,
        end_time: events.end_time,
        location: events.location,
      })
      .from(events)
      .where(
        and(
          isNull(events.deleted_at),
          sql`${events.event_date} >= ${today}`
        )
      )
      .orderBy(events.event_date)
      .limit(limit);

    return upcomingEvents.map((event) => {
      const eventDateValue = event.event_date;
      const eventDate = typeof eventDateValue === 'string' 
        ? eventDateValue 
        : (eventDateValue as Date).toISOString().split('T')[0];
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      let status: 'urgent' | 'this-week' | 'scheduled' | 'planned' = 'scheduled';
      if (eventDate === today || eventDate === tomorrowStr) {
        status = 'urgent';
      } else if (eventDate <= nextWeekStr) {
        status = 'this-week';
      }

      return {
        id: event.id,
        title: event.event_name,
        description: event.description || undefined,
        startDate: eventDate,
        location: event.location || undefined,
        status,
      };
    });
  }

  /**
   * Get research count
   */
  async getResearchCount(): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(research)
      .where(isNull(research.deleted_at));

    return result[0]?.count || 0;
  }
}
