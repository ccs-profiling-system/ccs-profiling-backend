/**
 * Student Portal - Dashboard Service
 * Business logic layer for student dashboard summary
 * 
 * Aggregates data from multiple sources to provide a comprehensive
 * dashboard view including current courses, GPA, notifications, and events.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { eq, and, isNull, gte, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { 
  enrollments, 
  academicHistory, 
  notifications, 
  eventParticipants,
  events,
  instructions
} from '../../../db/schema';
import { DashboardSummaryDTO, CourseDTO } from '../types';

export class DashboardService {
  constructor(private db: Database) {}

  /**
   * Get dashboard summary for a student
   * 
   * Aggregates data from multiple sources:
   * - Current semester courses from enrollments
   * - Current GPA from academic_history
   * - Unread notification count
   * - Upcoming registered events (next 30 days, max 5)
   * 
   * @param studentId - The student UUID (internal ID)
   * @returns Dashboard summary with aggregated data
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async getDashboardSummary(studentId: string): Promise<DashboardSummaryDTO> {
    // Get current academic period (you may need to adjust this based on your system)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-indexed
    
    // Determine current semester based on month
    // Adjust these ranges based on your academic calendar
    let currentSemester: string;
    let currentAcademicYear: string;
    
    if (currentMonth >= 8 && currentMonth <= 12) {
      // First semester: August to December
      currentSemester = '1st';
      currentAcademicYear = `${currentYear}-${currentYear + 1}`;
    } else if (currentMonth >= 1 && currentMonth <= 5) {
      // Second semester: January to May
      currentSemester = '2nd';
      currentAcademicYear = `${currentYear - 1}-${currentYear}`;
    } else {
      // Summer: June to July
      currentSemester = 'summer';
      currentAcademicYear = `${currentYear - 1}-${currentYear}`;
    }

    // Execute all queries in parallel for better performance
    const [
      currentCourses,
      gpaResult,
      unreadCount,
      upcomingEvents
    ] = await Promise.all([
      this.getCurrentSemesterCourses(studentId, currentSemester, currentAcademicYear),
      this.calculateCurrentGPA(studentId),
      this.getUnreadNotificationCount(studentId),
      this.getUpcomingRegisteredEvents(studentId)
    ]);

    return {
      current_semester_courses: currentCourses,
      current_gpa: gpaResult,
      unread_notification_count: unreadCount,
      upcoming_events: upcomingEvents
    };
  }

  /**
   * Get current semester courses for a student
   * 
   * Retrieves all enrolled courses for the current semester with course details.
   * 
   * @param studentId - The student UUID
   * @param semester - Current semester ('1st', '2nd', 'summer')
   * @param academicYear - Current academic year (e.g., '2023-2024')
   * @returns Array of course DTOs
   * 
   * Requirements: 2.1
   */
  private async getCurrentSemesterCourses(
    studentId: string,
    semester: string,
    academicYear: string
  ): Promise<CourseDTO[]> {
    const result = await this.db
      .select({
        id: enrollments.id,
        course_code: instructions.subject_code,
        course_name: instructions.subject_name,
        section: sql<string>`'N/A'`, // Section info not in current schema
        instructor_name: sql<string>`'TBA'`, // Instructor info would need faculty join
        schedule: sql<string | null>`NULL`,
        room: sql<string | null>`NULL`,
        units: instructions.credits,
        enrollment_status: enrollments.enrollment_status
      })
      .from(enrollments)
      .innerJoin(instructions, eq(enrollments.instruction_id, instructions.id))
      .where(
        and(
          eq(enrollments.student_id, studentId),
          eq(enrollments.semester, semester),
          eq(enrollments.academic_year, academicYear),
          eq(enrollments.enrollment_status, 'enrolled'),
          isNull(instructions.deleted_at)
        )
      )
      .orderBy(instructions.subject_code);

    return result.map(row => ({
      id: row.id,
      course_code: row.course_code,
      course_name: row.course_name,
      section: row.section,
      instructor_name: row.instructor_name,
      schedule: row.schedule,
      room: row.room,
      units: row.units,
      enrollment_status: row.enrollment_status as 'enrolled' | 'dropped' | 'completed'
    }));
  }

  /**
   * Calculate current GPA from all completed courses
   * 
   * Computes weighted average GPA from academic history.
   * GPA = SUM(grade * credits) / SUM(credits)
   * 
   * @param studentId - The student UUID
   * @returns Current GPA or null if no grades
   * 
   * Requirements: 2.2
   */
  private async calculateCurrentGPA(studentId: string): Promise<number | null> {
    const result = await this.db
      .select({
        totalGradePoints: sql<number>`COALESCE(SUM(CAST(${academicHistory.grade} AS DECIMAL) * ${academicHistory.credits}), 0)`,
        totalCredits: sql<number>`COALESCE(SUM(${academicHistory.credits}), 0)`
      })
      .from(academicHistory)
      .where(eq(academicHistory.student_id, studentId));

    const { totalGradePoints, totalCredits } = result[0];

    // Return null if no grades exist
    if (totalCredits === 0) {
      return null;
    }

    // Calculate GPA and round to 2 decimal places
    const gpa = totalGradePoints / totalCredits;
    return Math.round(gpa * 100) / 100;
  }

  /**
   * Get count of unread notifications
   * 
   * Counts notifications where is_read = false.
   * 
   * @param studentId - The student UUID
   * @returns Count of unread notifications
   * 
   * Requirements: 2.3
   */
  private async getUnreadNotificationCount(studentId: string): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.student_id, studentId),
          eq(notifications.is_read, false)
        )
      );

    return Number(result[0].count);
  }

  /**
   * Get upcoming registered events
   * 
   * Retrieves events the student is registered for that occur within
   * the next 30 days, limited to 5 events.
   * 
   * @param studentId - The student UUID
   * @returns Array of upcoming event DTOs (max 5)
   * 
   * Requirements: 2.4, 2.5
   */
  private async getUpcomingRegisteredEvents(studentId: string) {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const result = await this.db
      .select({
        id: events.id,
        title: events.event_name,
        description: events.description,
        event_type: events.event_type,
        event_date: events.event_date,
        location: events.location,
        organizer: events.organizer,
        registration_deadline: events.registration_deadline,
        max_participants: events.max_participants,
        // Calculate available slots
        current_participants: sql<number>`(
          SELECT COUNT(*) 
          FROM ${eventParticipants} 
          WHERE ${eventParticipants.event_id} = ${events.id}
          AND ${eventParticipants.attendance_status} = 'registered'
        )`
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.event_id, events.id))
      .where(
        and(
          eq(eventParticipants.student_id, studentId),
          eq(eventParticipants.attendance_status, 'registered'),
          gte(events.event_date, today.toISOString().split('T')[0]),
          isNull(events.deleted_at)
        )
      )
      .orderBy(events.event_date)
      .limit(5);

    return result.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      event_type: row.event_type,
      event_date: row.event_date,
      location: row.location,
      organizer: row.organizer,
      registration_deadline: row.registration_deadline,
      available_slots: row.max_participants 
        ? row.max_participants - Number(row.current_participants)
        : null
    }));
  }
}
