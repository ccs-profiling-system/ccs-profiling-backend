/**
 * Student Portal Types and Interfaces
 * 
 * This module defines all TypeScript types, interfaces, and DTOs used throughout
 * the student portal API system.
 * 
 */

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Student scope interface for data filtering
 */
export interface StudentScope {
  studentId: string;
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================================================
// Enums and Type Literals
// ============================================================================

/**
 * Notification types
 */
export type NotificationType = 'academic' | 'financial' | 'event' | 'system';

/**
 * Enrollment status types
 */
export type EnrollmentStatus = 'enrolled' | 'dropped' | 'completed';

/**
 * Academic standing types
 */
export type AcademicStanding = 'Good Standing' | 'Probation';

/**
 * Research application status types
 */
export type ResearchApplicationStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Event registration status types
 */
export type EventRegistrationStatus = 'registered' | 'cancelled' | 'attended';

/**
 * Appointment status types
 */
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

/**
 * Message sender role types
 */
export type MessageSenderRole = 'student' | 'faculty';

// ============================================================================
// Data Transfer Objects (DTOs)
// ============================================================================

/**
 * Student profile data transfer object
 */
export interface StudentProfileDTO {
  id: string;
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  phone: string | null;
  program: string;
  year_level: number;
  enrollment_status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Dashboard summary data transfer object
 */
export interface DashboardSummaryDTO {
  current_semester_courses: CourseDTO[];
  current_gpa: number | null;
  unread_notification_count: number;
  upcoming_events: EventDTO[];
}

/**
 * Academic progress data transfer object
 */
export interface AcademicProgressDTO {
  total_credits_earned: number;
  total_credits_required: number;
  current_year_level: number;
  academic_standing: AcademicStanding;
  completed_courses_by_semester: Array<{
    academic_year: string;
    semester: string;
    courses: Array<{
      course_code: string;
      course_name: string;
      units: number;
      grade: string;
    }>;
  }>;
}

/**
 * Financial record data transfer object
 */
export interface FinancialRecordDTO {
  total_tuition: number;
  total_fees: number;
  total_payments: number;
  outstanding_balance: number;
  payment_history: Array<{
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_number: string;
  }>;
}

/**
 * Notification data transfer object
 */
export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Course data transfer object
 */
export interface CourseDTO {
  id: string;
  course_code: string;
  course_name: string;
  section: string;
  instructor_name: string;
  schedule: string | null;
  room: string | null;
  units: number;
  enrollment_status: EnrollmentStatus;
}

/**
 * Course details data transfer object
 */
export interface CourseDetailsDTO extends CourseDTO {
  description: string | null;
  learning_outcomes: string | null;
  grading_criteria: string | null;
  required_materials: string | null;
  instructor_email: string;
  instructor_phone: string | null;
  course_materials: Array<{
    title: string;
    type: string;
    upload_date: string;
  }>;
}

/**
 * Weekly schedule entry data transfer object
 */
export interface ScheduleEntryDTO {
  course_code: string;
  course_name: string;
  instructor_name: string;
  room: string | null;
  day: string;
  start_time: string;
  end_time: string;
}

/**
 * Weekly schedule data transfer object
 */
export interface WeeklyScheduleDTO {
  [day: string]: ScheduleEntryDTO[];
}

/**
 * Grade data transfer object
 */
export interface GradeDTO {
  id: string;
  course_code: string;
  course_name: string;
  grade_value: string;
  grade_points: number;
  units: number;
  remarks: string | null;
  semester: string;
  academic_year: string;
}

/**
 * GPA calculation data transfer object
 */
export interface GPADTO {
  cumulative_gpa: number;
  current_semester_gpa: number | null;
  total_units_attempted: number;
  total_units_earned: number;
}

/**
 * Grade history data transfer object
 */
export interface GradeHistoryDTO {
  semesters: Array<{
    academic_year: string;
    semester: string;
    semester_gpa: number;
    grades: GradeDTO[];
  }>;
}

/**
 * Research opportunity data transfer object
 */
export interface ResearchOpportunityDTO {
  id: string;
  title: string;
  description: string | null;
  research_type: string;
  faculty_adviser_name: string;
  required_skills: string | null;
  start_date: string | null;
  application_deadline: string | null;
  available_positions: number | null;
  current_applicants: number;
}

/**
 * Research opportunity details data transfer object
 */
export interface ResearchOpportunityDetailsDTO extends ResearchOpportunityDTO {
  full_description: string | null;
  required_qualifications: string | null;
  time_commitment: string | null;
  compensation_details: string | null;
  faculty_email: string;
  faculty_phone: string | null;
}

/**
 * Research application status data transfer object
 */
export interface ResearchApplicationStatusDTO {
  id: string;
  research_title: string;
  faculty_adviser_name: string;
  application_date: string;
  status: ResearchApplicationStatus;
  faculty_feedback: string | null;
}

/**
 * Event data transfer object
 */
export interface EventDTO {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  location: string | null;
  organizer: string | null;
  registration_deadline: string | null;
  available_slots: number | null;
}

/**
 * Registered event data transfer object
 */
export interface RegisteredEventDTO extends EventDTO {
  registration_date: string;
  attendance_status: string | null;
}

/**
 * Advisor data transfer object
 */
export interface AdvisorDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  office_location: string | null;
  consultation_hours: string | null;
  specialization: string | null;
}

/**
 * Message data transfer object
 */
export interface MessageDTO {
  id: string;
  sender_name: string;
  sender_role: MessageSenderRole;
  message_content: string;
  is_read: boolean;
  sent_at: string;
}

/**
 * Appointment slot data transfer object
 */
export interface AppointmentSlotDTO {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

/**
 * Appointment data transfer object
 */
export interface AppointmentDTO {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: AppointmentStatus;
  advisor_notes: string | null;
}
