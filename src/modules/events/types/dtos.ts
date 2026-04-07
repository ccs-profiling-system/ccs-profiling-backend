/**
 * Events Module DTOs
 * Data Transfer Objects for event management
 * 
 */

/**
 * CreateEventDTO - Input for creating new events
 */
export interface CreateEventDTO {
  event_name: string;
  event_type: 'seminar' | 'workshop' | 'defense' | 'competition';
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
}

/**
 * UpdateEventDTO - Input for updating events
 */
export interface UpdateEventDTO {
  event_name?: string;
  event_type?: 'seminar' | 'workshop' | 'defense' | 'competition';
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
}

/**
 * EventResponseDTO - Output returned to clients
 */
export interface EventResponseDTO {
  id: string;
  event_name: string;
  event_type: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
  participant_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * EventListResponseDTO - Paginated list output
 */
export interface EventListResponseDTO {
  data: EventResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * EventParticipantDTO - Participant information
 */
export interface EventParticipantDTO {
  id: string;
  event_id: string;
  student_id?: string;
  faculty_id?: string;
  participant_name: string;
  participant_type: 'student' | 'faculty';
  participation_role?: string;
  attendance_status: string;
  created_at: string;
}

/**
 * AddParticipantDTO - Input for adding participants
 */
export interface AddParticipantDTO {
  student_id?: string;
  faculty_id?: string;
  participation_role?: string;
  attendance_status?: 'registered' | 'attended' | 'absent' | 'cancelled';
}

/**
 * EventFilters - Query filters for listing events
 */
export interface EventFilters {
  search?: string;
  event_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}
