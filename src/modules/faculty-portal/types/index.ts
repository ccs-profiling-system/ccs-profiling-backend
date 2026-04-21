/**
 * Faculty Portal Types and Interfaces
 * 
 * This module defines all TypeScript types, interfaces, and DTOs used throughout
 * the faculty portal API system.
 */

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Faculty scope interface for data filtering
 */
export interface FacultyScope {
  facultyId: string;
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
 * Attendance status types
 */
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

/**
 * Course material types
 */
export type MaterialType = 
  | 'lecture_notes' 
  | 'assignment' 
  | 'reading_material' 
  | 'syllabus' 
  | 'exam' 
  | 'other';

/**
 * Research project status types
 */
export type ResearchStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected';

// ============================================================================
// Data Transfer Objects (DTOs)
// ============================================================================

/**
 * Faculty profile data transfer object
 */
export interface FacultyProfileDTO {
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
  created_at: string;
  updated_at: string;
}

/**
 * Course data transfer object
 */
export interface CourseDTO {
  id: string;
  subject_code: string;
  subject_name: string;
  section: string;
  schedule: string | null;
  room: string | null;
  units: number;
  enrolled_student_count: number;
  semester: string;
  academic_year: string;
}

/**
 * Teaching load data transfer object
 */
export interface TeachingLoadDTO {
  total_units: number;
  total_courses: number;
  semester: string;
  academic_year: string;
  courses: Array<{
    subject_code: string;
    subject_name: string;
    section: string;
    units: number;
  }>;
}

/**
 * Student roster data transfer object
 */
export interface StudentRosterDTO {
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  email: string;
  year_level: number | null;
  enrollment_status: string;
}

/**
 * Attendance record data transfer object
 */
export interface AttendanceRecordDTO {
  id: string;
  date: string;
  student_id: string;
  student_name: string;
  status: AttendanceStatus;
  remarks: string | null;
}

/**
 * Research project data transfer object
 */
export interface ResearchProjectDTO {
  id: string;
  title: string;
  description: string | null;
  research_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  funding_source: string | null;
  budget: number | null;
  student_researchers: Array<{
    student_id: string;
    student_name: string;
  }>;
  advisers: Array<{
    faculty_id: string;
    faculty_name: string;
    adviser_role: string;
  }>;
  created_at: string;
  updated_at: string;
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
  max_participants: number | null;
  registration_deadline: string | null;
  registration_status: 'open' | 'closed' | 'full';
  is_registered: boolean;
}

/**
 * Course material data transfer object
 */
export interface CourseMaterialDTO {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  material_type: MaterialType;
  file_url: string;
  file_size: number;
  upload_date: string;
  uploaded_by: string;
}
