/**
 * Dashboard Module DTOs
 * Data Transfer Objects for dashboard metrics
 * 
 */

/**
 * StudentStatsDTO - Student statistics
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
 */
export interface FacultyStatsDTO {
  total_faculty: number;
  active_faculty: number;
  inactive_faculty: number;
  faculty_by_department?: Record<string, number>;
}

/**
 * EnrollmentStatsDTO - Enrollment statistics
 */
export interface EnrollmentStatsDTO {
  total_enrollments: number;
  enrollments_by_status?: Record<string, number>;
  enrollments_by_semester?: Record<string, number>;
  current_semester_enrollments?: number;
}

/**
 * EventStatsDTO - Event statistics
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
 */
export interface DashboardMetricsDTO {
  students: StudentStatsDTO;
  faculty: FacultyStatsDTO;
  enrollments: EnrollmentStatsDTO;
  events: EventStatsDTO;
  research: { total_research: number };
  generated_at: string;
}

/**
 * RecentActivityDTO - Recent activity item
 */
export interface RecentActivityDTO {
  id: string;
  type: 'student' | 'faculty' | 'event' | 'research' | 'report';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

/**
 * PriorityAlertDTO - Priority alert item
 */
export interface PriorityAlertDTO {
  id: string;
  type: 'urgent' | 'important' | 'reminder';
  title: string;
  description: string;
  actionUrl: string;
  count?: number;
  dueDate?: string;
  createdAt: string;
}

/**
 * UpcomingEventDTO - Upcoming event item
 */
export interface UpcomingEventDTO {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  status: 'urgent' | 'this-week' | 'scheduled' | 'planned';
  attendees?: number;
  organizer?: string;
}
