/**
 * Event Service
 * 
 * Provides business logic for event management in the department chair portal.
 * All operations are department-scoped to ensure multi-tenant data isolation.
 * 
 * Features:
 * - List events with pagination and filtering
 * - Create events with initial draft state
 * - Get individual event details with participant count
 * - Update events with workflow state validation
 * - Delete events with state validation
 * - Approve/reject events with workflow validation
 * - Get event participants
 * - Audit logging for approval/rejection actions
 * 
 */

import { db } from '../../../db';
import { events, eventParticipants } from '../../../db/schema';
import { students } from '../../../db/schema/students';
import { faculty } from '../../../db/schema/faculty';
import { eq, and, isNull, gte, lte, sql } from 'drizzle-orm';
import { PaginatedResponse, PaginationParams } from '../types';
import { 
  validateApprovalState, 
  validateRejectionState, 
  validateUpdateState,
  validateDeleteState 
} from '../utils/workflowValidation';
import { AuditLogRepository, CreateAuditLogData } from '../../audit-logs/repositories/auditLog.repository';

/**
 * Event filters for list queries
 */
export interface EventFilters extends PaginationParams {
  type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Event creation data
 */
export interface CreateEventData {
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  location: string;
  organizer: string;
  max_participants?: number;
  registration_deadline?: string;
}

/**
 * Event update data
 */
export interface UpdateEventData {
  title?: string;
  description?: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  organizer?: string;
  max_participants?: number;
  registration_deadline?: string;
}

/**
 * Event response DTO
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
  status: string;
  department_id: string | null;
  participant_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Event participant DTO
 */
export interface EventParticipantDTO {
  id: string;
  event_id: string;
  student_id: string | null;
  faculty_id: string | null;
  participation_role: string | null;
  attendance_status: string;
  participant_name?: string;
  participant_email?: string;
  created_at: string;
}

/**
 * Approval action data
 */
export interface ApprovalData {
  approver_notes?: string;
}

/**
 * Rejection action data
 */
export interface RejectionData {
  rejection_reason: string;
}

export class EventService {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository(db);
  }

  /**
   * List events with pagination and filtering
   * 
   * Supports filtering by:
   * - type: Filter by event type
   * - status: Filter by event status (draft, pending_approval, approved, rejected)
   * - start_date: Filter events on or after this date
   * - end_date: Filter events on or before this date
   * 
   * All results are scoped to the specified department.
   * 
   * @param departmentId - Department ID to scope the query
   * @param filters - Pagination and filter parameters
   * @returns Paginated list of events
   * 
   */
  async listEvents(
    departmentId: string,
    filters: EventFilters
  ): Promise<PaginatedResponse<EventDTO>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions: any[] = [
      isNull(events.deleted_at),
    ];

    // Add department filter only if departmentId is provided (for department-scoped access)
    if (departmentId) {
      conditions.push(eq(events.department_id, departmentId));
    }

    // Add type filter
    if (filters.type) {
      conditions.push(eq(events.event_type, filters.type));
    }

    // Add status filter
    if (filters.status) {
      conditions.push(eq(events.status, filters.status));
    }

    // Add date range filters
    if (filters.start_date) {
      conditions.push(gte(events.event_date, filters.start_date));
    }

    if (filters.end_date) {
      conditions.push(lte(events.event_date, filters.end_date));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    // Get paginated results
    const results = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${events.event_date} DESC, ${events.created_at} DESC`);

    // Get participant counts for each event
    const eventsWithCounts = await Promise.all(
      results.map(async (event) => {
        const participantCount = await this.getParticipantCount(event.id);
        return this.toDTO(event, participantCount);
      })
    );

    return {
      data: eventsWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new event
   * 
   * Sets initial state to 'draft' and associates with department.
   * 
   * @param data - Event creation data
   * @param departmentId - Department ID to associate with event
   * @returns Created event
   * 
   */
  async createEvent(
    data: CreateEventData,
    departmentId: string
  ): Promise<EventDTO> {
    const result = await db
      .insert(events)
      .values({
        event_name: data.title,
        description: data.description,
        event_type: data.event_type,
        event_date: data.event_date,
        location: data.location,
        organizer: data.organizer,
        max_participants: data.max_participants,
        registration_deadline: data.registration_deadline,
        status: 'draft',
        department_id: departmentId,
      })
      .returning();

    const createdEvent = result[0];
    return this.toDTO(createdEvent, 0);
  }

  /**
   * Get event by ID with department validation
   * 
   * Validates that the event belongs to the specified department.
   * Returns null if event doesn't exist or is outside department scope.
   * Includes participant count in the response.
   * 
   * @param id - Event ID
   * @param departmentId - Department ID to validate scope
   * @returns Event details with participant count or null if not found
   * 
   */
  async getEventById(id: string, departmentId: string): Promise<EventDTO | null> {
    // Build conditions - only filter by department if departmentId is provided
    const conditions: any[] = [
      eq(events.id, id),
      isNull(events.deleted_at),
    ];

    if (departmentId) {
      conditions.push(eq(events.department_id, departmentId));
    }

    const result = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) {
      return null;
    }

    const participantCount = await this.getParticipantCount(id);
    return this.toDTO(result[0], participantCount);
  }

  /**
   * Update an event
   * 
   * Validates:
   * - Event exists and belongs to department
   * - Event status is 'draft' or 'pending_approval'
   * 
   * @param id - Event ID
   * @param data - Event update data
   * @param departmentId - Department ID to validate scope
   * @returns Updated event or null if not found
   * @throws Error if event is not in valid state for update
   * 
   */
  async updateEvent(
    id: string,
    data: UpdateEventData,
    departmentId: string
  ): Promise<EventDTO | null> {
    // Get event and validate department scope
    const event = await this.getEventById(id, departmentId);
    if (!event) {
      return null;
    }

    // Validate workflow state
    const validation = validateUpdateState(event.status as any);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.title !== undefined) updateData.event_name = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.event_type !== undefined) updateData.event_type = data.event_type;
    if (data.event_date !== undefined) updateData.event_date = data.event_date;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.organizer !== undefined) updateData.organizer = data.organizer;
    if (data.max_participants !== undefined) updateData.max_participants = data.max_participants;
    if (data.registration_deadline !== undefined) updateData.registration_deadline = data.registration_deadline;

    // Update event
    const updateResult = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();

    const updatedEvent = updateResult[0];
    const participantCount = await this.getParticipantCount(id);
    return this.toDTO(updatedEvent, participantCount);
  }

  /**
   * Delete an event
   * 
   * Validates:
   * - Event exists and belongs to department
   * - Event status is 'draft' or 'approved' (approved events can be cancelled)
   * 
   * Performs soft delete by setting deleted_at timestamp.
   * 
   * @param id - Event ID
   * @param departmentId - Department ID to validate scope
   * @returns True if deleted, false if not found
   * @throws Error if event is not in valid state for deletion
   * 
   */
  async deleteEvent(id: string, departmentId: string): Promise<boolean> {
    // Get event and validate department scope
    const event = await this.getEventById(id, departmentId);
    if (!event) {
      return false;
    }

    // Validate workflow state (allow deletion of draft or approved events)
    const validation = validateDeleteState(event.status as any, true);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Soft delete event
    await db
      .update(events)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(events.id, id));

    return true;
  }

  /**
   * Approve an event
   * 
   * Validates:
   * - Event exists and belongs to department
   * - Event status is 'pending_approval'
   * 
   * On success:
   * - Updates event status to 'approved'
   * - Creates audit log entry
   * 
   * @param id - Event ID
   * @param departmentId - Department ID to validate scope
   * @param approvalData - Approval data including optional notes
   * @param userId - ID of user performing the approval
   * @returns Updated event or null if not found
   * @throws Error if event is not in valid state for approval
   * 
   */
  async approveEvent(
    id: string,
    departmentId: string,
    approvalData: ApprovalData,
    userId: string
  ): Promise<EventDTO | null> {
    // Get event and validate department scope
    const event = await this.getEventById(id, departmentId);
    if (!event) {
      return null;
    }

    // Validate workflow state
    const validation = validateApprovalState(event.status as any);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update event status
    const updateResult = await db
      .update(events)
      .set({
        status: 'approved',
        updated_at: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    const updatedEvent = updateResult[0];

    // Create audit log entry
    const auditLogData: CreateAuditLogData = {
      user_id: userId,
      action_type: 'approve',
      entity_type: 'event',
      entity_id: id,
      before_state: { status: event.status },
      after_state: { 
        status: 'approved',
        approver_notes: approvalData.approver_notes,
      },
    };

    await this.auditLogRepository.create(auditLogData);

    const participantCount = await this.getParticipantCount(id);
    return this.toDTO(updatedEvent, participantCount);
  }

  /**
   * Reject an event
   * 
   * Validates:
   * - Event exists and belongs to department
   * - Event status is 'pending_approval'
   * 
   * On success:
   * - Updates event status to 'rejected'
   * - Creates audit log entry with rejection reason
   * 
   * @param id - Event ID
   * @param departmentId - Department ID to validate scope
   * @param rejectionData - Rejection data including required reason
   * @param userId - ID of user performing the rejection
   * @returns Updated event or null if not found
   * @throws Error if event is not in valid state for rejection
   * 
   */
  async rejectEvent(
    id: string,
    departmentId: string,
    rejectionData: RejectionData,
    userId: string
  ): Promise<EventDTO | null> {
    // Get event and validate department scope
    const event = await this.getEventById(id, departmentId);
    if (!event) {
      return null;
    }

    // Validate workflow state
    const validation = validateRejectionState(event.status as any);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update event status
    const updateResult = await db
      .update(events)
      .set({
        status: 'rejected',
        updated_at: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    const updatedEvent = updateResult[0];

    // Create audit log entry
    const auditLogData: CreateAuditLogData = {
      user_id: userId,
      action_type: 'reject',
      entity_type: 'event',
      entity_id: id,
      before_state: { status: event.status },
      after_state: { 
        status: 'rejected',
        rejection_reason: rejectionData.rejection_reason,
      },
    };

    await this.auditLogRepository.create(auditLogData);

    const participantCount = await this.getParticipantCount(id);
    return this.toDTO(updatedEvent, participantCount);
  }

  /**
   * Get event participants
   * 
   * Returns list of participants (students and faculty) for an event.
   * Includes participant details and registration information.
   * 
   * @param id - Event ID
   * @param departmentId - Department ID to validate scope
   * @returns List of event participants or null if event not found
   * 
   */
  async getEventParticipants(
    id: string,
    departmentId: string
  ): Promise<EventParticipantDTO[] | null> {
    // Validate event exists and belongs to department
    const event = await this.getEventById(id, departmentId);
    if (!event) {
      return null;
    }

    // Get participants with student/faculty details
    const participants = await db
      .select({
        id: eventParticipants.id,
        event_id: eventParticipants.event_id,
        student_id: eventParticipants.student_id,
        faculty_id: eventParticipants.faculty_id,
        participation_role: eventParticipants.participation_role,
        attendance_status: eventParticipants.attendance_status,
        created_at: eventParticipants.created_at,
        student_first_name: students.first_name,
        student_last_name: students.last_name,
        student_email: students.email,
        faculty_first_name: faculty.first_name,
        faculty_last_name: faculty.last_name,
        faculty_email: faculty.email,
      })
      .from(eventParticipants)
      .leftJoin(students, eq(eventParticipants.student_id, students.id))
      .leftJoin(faculty, eq(eventParticipants.faculty_id, faculty.id))
      .where(eq(eventParticipants.event_id, id));

    return participants.map((p) => ({
      id: p.id,
      event_id: p.event_id,
      student_id: p.student_id,
      faculty_id: p.faculty_id,
      participation_role: p.participation_role,
      attendance_status: p.attendance_status || 'registered',
      participant_name: p.student_id
        ? `${p.student_first_name} ${p.student_last_name}`
        : p.faculty_id
        ? `${p.faculty_first_name} ${p.faculty_last_name}`
        : undefined,
      participant_email: p.student_id 
        ? (p.student_email || undefined) 
        : p.faculty_id 
        ? (p.faculty_email || undefined) 
        : undefined,
      created_at: p.created_at.toISOString(),
    }));
  }

  /**
   * Get participant count for an event
   * 
   * @param eventId - Event ID
   * @returns Number of participants
   */
  private async getParticipantCount(eventId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventParticipants)
      .where(eq(eventParticipants.event_id, eventId));

    return result[0]?.count || 0;
  }

  /**
   * Transform database entity to DTO
   */
  private toDTO(event: any, participantCount?: number): EventDTO {
    return {
      id: event.id,
      title: event.event_name,
      description: event.description,
      event_type: event.event_type,
      event_date: event.event_date,
      location: event.location,
      organizer: event.organizer,
      max_participants: event.max_participants,
      registration_deadline: event.registration_deadline,
      status: event.status,
      department_id: event.department_id,
      participant_count: participantCount,
      created_at: event.created_at.toISOString(),
      updated_at: event.updated_at.toISOString(),
    };
  }
}
