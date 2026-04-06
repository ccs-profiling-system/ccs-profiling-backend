/**
 * Dashboard Module DTOs
 * Data Transfer Objects for dashboard metrics
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7
 */

/**
 * StudentStatsDTO - Student statistics
 * Requirement: 15.3
 */
export interface StudentStatsDTO {
  total_students: number;
  active_students: number;
  inactive_students: number;
  graduated_students: number;
  students_by_program?: Record<string, number>;
  students_by_year_level?: Record<string, number>;
}

/**
 * FacultyStatsDTO - Faculty statistics
 * Requirement: 15.4
 */
export interface FacultyStatsDTO {
  total_faculty: number;
  active_faculty: number;
  inactive_faculty: number;
  faculty_by_department?: Record<string, number>;
}

/**
 * EnrollmentStatsDTO - Enrollment statistics
 * Requirement: 15.6
 */
export interface EnrollmentStatsDTO {
  total_enrollments: number;
  enrollments_by_status?: Record<string, number>;
  enrollments_by_semester?: Record<string, number>;
  current_semester_enrollments?: number;
}

/**
 * EventStatsDTO - Event statistics
 * Requirement: 15.5
 */
export interface EventStatsDTO {
  total_events: number;
  events_by_type?: Record<string, number>;
  upcoming_events: number;
  past_events: number;
}

/**
 * DashboardMetricsDTO - Complete dashboard metrics
 * Aggregates all dashboard statistics
 * Requirements: 15.1, 15.2, 15.7
 */
export interface DashboardMetricsDTO {
  students: StudentStatsDTO;
  faculty: FacultyStatsDTO;
  enrollments: EnrollmentStatsDTO;
  events: EventStatsDTO;
  generated_at: string;
}
