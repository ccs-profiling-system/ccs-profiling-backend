/**
 * Scheduling Module DTOs
 * Data Transfer Objects for schedule management
 * 
 */

/**
 * CreateScheduleDTO - Input for creating new schedule
 */
export interface CreateScheduleDTO {
  schedule_type: 'class' | 'exam' | 'consultation';
  instruction_id?: string;
  faculty_id?: string;
  room: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time: string;
  end_time: string;
  semester: '1st' | '2nd' | 'summer';
  academic_year: string;
}

/**
 * UpdateScheduleDTO - Input for updating schedule
 */
export interface UpdateScheduleDTO {
  schedule_type?: 'class' | 'exam' | 'consultation';
  instruction_id?: string;
  faculty_id?: string;
  room?: string;
  day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time?: string;
  end_time?: string;
  semester?: '1st' | '2nd' | 'summer';
  academic_year?: string;
}

/**
 * ScheduleResponseDTO - Output returned to clients
 */
export interface ScheduleResponseDTO {
  id: string;
  schedule_type: string;
  instruction_id?: string;
  subject_code?: string;
  subject_name?: string;
  faculty_id?: string;
  faculty_name?: string;
  room: string;
  day: string;
  start_time: string;
  end_time: string;
  semester: string;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

/**
 * ScheduleListResponseDTO - Paginated list output
 */
export interface ScheduleListResponseDTO {
  data: ScheduleResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * ConflictCheckParams - Parameters for checking schedule conflicts
 */
export interface ConflictCheckParams {
  room: string;
  day: string;
  start_time: string;
  end_time: string;
  semester: string;
  academic_year: string;
  excludeId?: string; // For update operations
}

/**
 * ScheduleFilters - Query filters for listing schedules
 */
export interface ScheduleFilters {
  room?: string;
  day?: string;
  schedule_type?: string;
  faculty_id?: string;
  instruction_id?: string;
  semester?: string;
  academic_year?: string;
  page?: number;
  limit?: number;
}
