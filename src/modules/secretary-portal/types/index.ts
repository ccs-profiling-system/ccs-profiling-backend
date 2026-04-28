/**
 * Secretary Portal Types and Interfaces
 * 
 * Defines TypeScript types, interfaces, and DTOs for the Secretary Portal API.
 * These types ensure type safety across the module and provide clear contracts
 * for data structures used in services, controllers, and routes.
 */

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata returned with list responses
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
// Enum Types
// ============================================================================

/**
 * Approval workflow status
 */
export type ApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'withdrawn';

/**
 * Document category types
 */
export type DocumentCategory = 'memo' | 'policy' | 'form' | 'report' | 'other';

/**
 * Event types
 */
export type EventType = 'seminar' | 'workshop' | 'defense' | 'competition' | 'conference' | 'meeting' | 'other';

/**
 * Research project types
 */
export type ResearchType = 'thesis' | 'capstone' | 'publication' | 'grant';

/**
 * Report output formats
 */
export type ReportFormat = 'pdf' | 'excel' | 'csv';

/**
 * Days of the week
 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Academic semester types
 */
export type Semester = '1st' | '2nd' | 'summer';

// ============================================================================
// Data Transfer Objects (DTOs)
// ============================================================================

/**
 * Student Data Transfer Object
 */
export interface StudentDTO {
  id: string;
  student_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  year_level: number | null;
  program: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Faculty Data Transfer Object
 */
export interface FacultyDTO {
  id: string;
  faculty_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  phone: string | null;
  department: string;
  position: string | null;
  specialization: string | null;
  office_location: string | null;
  consultation_hours: string | null;
  bio: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Schedule Data Transfer Object
 */
export interface ScheduleDTO {
  id: string;
  schedule_type: string;
  subject_id: string | null;
  faculty_id: string | null;
  room: string;
  day: DayOfWeek;
  start_time: string;
  end_time: string;
  semester: Semester;
  academic_year: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Document Data Transfer Object
 */
export interface DocumentDTO {
  id: string;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  entity_type: string;
  entity_id: string;
  uploaded_by: string | null;
  category: DocumentCategory;
  title: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Event Data Transfer Object
 */
export interface EventDTO {
  id: string;
  event_name: string;
  event_type: EventType;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  organizer: string | null;
  max_participants: number | null;
  registration_deadline: string | null;
  status: ApprovalStatus;
  department_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Research Data Transfer Object
 */
export interface ResearchDTO {
  id: string;
  title: string;
  abstract: string | null;
  research_type: ResearchType;
  status: ApprovalStatus;
  start_date: string | null;
  completion_date: string | null;
  publication_url: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Pending Change Data Transfer Object
 */
export interface PendingChangeDTO {
  id: string;
  entity_type: string;
  entity_id: string;
  change_type: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  status: ApprovalStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Dashboard Statistics Data Transfer Object
 */
export interface DashboardDTO {
  stats: {
    total_students: number;
    total_faculty: number;
    total_events: number;
    total_research: number;
    pending_changes: number;
  };
  recent_activities: ActivityDTO[];
}

/**
 * Activity Data Transfer Object for dashboard
 */
export interface ActivityDTO {
  activity_type: string;
  entity_type: string;
  entity_id: string;
  timestamp: Date;
  user_id: string | null;
  description?: string;
}

/**
 * Academic History Data Transfer Object
 */
export interface AcademicHistoryDTO {
  id: string;
  student_id: string;
  subject_code: string;
  subject_name: string;
  grade: string;
  semester: Semester;
  academic_year: string;
  credits: number;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Teaching Load Data Transfer Object
 */
export interface TeachingLoadDTO {
  id: string;
  faculty_id: string;
  instruction_id: string;
  subject_code: string;
  subject_name: string;
  semester: Semester;
  academic_year: string;
  total_hours: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Event Participant Data Transfer Object
 */
export interface EventParticipantDTO {
  id: string;
  event_id: string;
  student_id: string | null;
  faculty_id: string | null;
  participation_role: string | null;
  attendance_status: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Research Author Data Transfer Object
 */
export interface ResearchAuthorDTO {
  id: string;
  research_id: string;
  student_id: string;
  author_order: number;
  student_name?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Research File Data Transfer Object
 */
export interface ResearchFileDTO {
  id: string;
  research_id: string;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
}
