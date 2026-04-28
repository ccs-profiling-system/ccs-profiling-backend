/**
 * Faculty Portal - Event Service
 * Business logic layer for event management and participation
 * 
 * Handles event viewing, participation tracking, and event registration for faculty members.
 * Validates event access by department, registration deadlines, and capacity limits.
 * 
 */

import { eq, and, isNull, sql, gte } from 'drizzle-orm';
import { Database } from '../../../db';
import { events, eventParticipants, faculty } from '../../../db/schema';
import { EventDTO, PaginationParams, PaginatedResponse } from '../types';

/**
 * Event not found error
 * Thrown when an event doesn't exist
 */
export class EventNotFoundError extends Error {
  public readonly statusCode: number = 404;
  public readonly code: string = 'EVENT_NOT_FOUND';

  constructor(eventId: string) {
    super(`Event with ID ${eventId} not found`);
    this.name = 'EventNotFoundError';
    Object.setPrototypeOf(this, EventNotFoundError.prototype);
  }
}

/**
 * Event access denied error
 * Thrown when faculty attempts to access event outside their department
 */
export class EventAccessDeniedError extends Error {
  public readonly statusCode: number = 403;
  public readonly code: string = 'EVENT_ACCESS_DENIED';

  constructor() {
    super('You do not have permission to access this event');
    this.name = 'EventAccessDeniedError';
    Object.setPrototypeOf(this, EventAccessDeniedError.prototype);
  }
}

/**
 * Already registered error
 * Thrown when faculty is already registered for an event
 */
export class AlreadyRegisteredError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = 'ALREADY_REGISTERED';

  constructor() {
    super('Already registered for this event');
    this.name = 'AlreadyRegisteredError';
    Object.setPrototypeOf(this, AlreadyRegisteredError.prototype);
  }
}

/**
 * Registration deadline passed error
 * Thrown when attempting to register after the deadline
 */
export class RegistrationDeadlinePassedError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = 'REGISTRATION_DEADLINE_PASSED';

  constructor() {
    super('Registration deadline has passed');
    this.name = 'RegistrationDeadlinePassedError';
    Object.setPrototypeOf(this, RegistrationDeadlinePassedError.prototype);
  }
}

/**
 * Event full error
 * Thrown when event has reached max_participants
 */
export class EventFullError extends Error {
  public readonly statusCode: number = 422;
  public readonly code: string = 'EVENT_FULL';

  constructor() {
    super('Event is full');
    this.name = 'EventFullError';
    Object.setPrototypeOf(this, EventFullError.prototype);
  }
}

/**
 * Event filters for list queries
 */
export interface EventFilters {
  type?: string;
  upcoming?: boolean;
}

/**
 * Event participation data
 */
export interface EventParticipationDTO {
  event_id: string;
  event_name: string;
  event_type: string;
  event_date: string;
  location: string | null;
  registration_date: string;
  attendance_status: string;
  participation_role: string | null;
}

export class EventService {
  constructor(private db: Database) {}

  /**
   * List events by faculty's department with pagination and filtering
   * 
   * Retrieves events filtered by the faculty member's department.
   * Supports pagination and filtering by event type and upcoming events.
   * 
   * @param facultyId - The faculty UUID
   * @param pagination - Pagination parameters (page, limit)
   * @param filters - Optional filters (type, upcoming)
   * @returns Paginated list of events
   * 
   * - 8.1: Endpoint protected by faculty.event.read permission with pagination
   * - 8.2: Filter results by authenticated user's department
   * - 8.3: Accept page, limit, type, and upcoming query parameters
   * - 8.4: Filter events with event_date >= current date when upcoming is true
   * - 8.5: Return event details including title, description, event_type, event_date, location, organizer, registration_status
   */
  async listEventsByDepartment(
    facultyId: string,
    pagination: PaginationParams,
    filters?: EventFilters
  ): Promise<PaginatedResponse<EventDTO>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Get faculty's department
    const facultyResult = await this.db
      .select({ department: faculty.department })
      .from(faculty)
      .where(and(eq(faculty.id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    if (facultyResult.length === 0) {
      throw new Error('Faculty not found');
    }

    const facultyDepartment = facultyResult[0].department;

    // Build conditions for filtering
    const conditions = [
      isNull(events.deleted_at),
      eq(events.department_id, facultyDepartment),
    ];

    if (filters?.type) {
      conditions.push(eq(events.event_type, filters.type));
    }

    if (filters?.upcoming) {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(gte(events.event_date, today));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated events
    const eventsList = await this.db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(sql`${events.event_date} ASC`)
      .limit(limit)
      .offset(offset);

    // Check registration status for each event
    const eventDTOs = await Promise.all(
      eventsList.map(event => this.buildEventDTO(event, facultyId))
    );

    return {
      data: eventDTOs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get faculty's event participation
   * 
   * Retrieves all events the faculty member is registered for with participation details.
   * 
   * @param facultyId - The faculty UUID
   * @returns List of event participation records
   * 
   * - 8.6: Endpoint protected by faculty.event.read permission
   * - 8.7: Filter results by authenticated user's faculty_id
   * - 8.8: Return events the faculty member is registered for with participation status
   * - 8.9: Include registration_date and attendance_status
   */
  async getParticipationByFaculty(facultyId: string): Promise<EventParticipationDTO[]> {
    const participations = await this.db
      .select({
        event_id: eventParticipants.event_id,
        event_name: events.event_name,
        event_type: events.event_type,
        event_date: events.event_date,
        location: events.location,
        registration_date: eventParticipants.created_at,
        attendance_status: eventParticipants.attendance_status,
        participation_role: eventParticipants.participation_role,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.event_id, events.id))
      .where(
        and(
          eq(eventParticipants.faculty_id, facultyId),
          isNull(events.deleted_at)
        )
      )
      .orderBy(sql`${events.event_date} DESC`);

    return participations.map(p => ({
      event_id: p.event_id,
      event_name: p.event_name,
      event_type: p.event_type,
      event_date: p.event_date,
      location: p.location,
      registration_date: p.registration_date.toISOString(),
      attendance_status: p.attendance_status || 'registered',
      participation_role: p.participation_role,
    }));
  }

  /**
   * Register faculty for an event
   * 
   * Creates a participation record for the faculty member.
   * Validates event exists, belongs to faculty's department, registration deadline,
   * capacity limits, and prevents duplicate registrations.
   * 
   * @param eventId - The event UUID
   * @param facultyId - The faculty UUID
   * @returns Created participation record
   * @throws EventNotFoundError if event doesn't exist (HTTP 404)
   * @throws EventAccessDeniedError if event not in faculty's department (HTTP 403)
   * @throws AlreadyRegisteredError if faculty already registered (HTTP 400)
   * @throws RegistrationDeadlinePassedError if deadline passed (HTTP 400)
   * @throws EventFullError if event reached max_participants (HTTP 422)
   * 
   * - 8.10: Endpoint protected by faculty.event.register permission
   * - 8.11: Validate eventId exists and belongs to faculty's department
   * - 8.12: Validate registration_deadline has not passed
   * - 8.13: Validate event has not reached max_participants
   * - 8.14: Validate faculty is not already registered
   * - 8.15: Return HTTP 400 if already registered
   * - 8.16: Create participation record with status 'registered'
   * - 8.17: Return HTTP 422 if event is full
   * - 8.18: Return HTTP 400 if registration deadline has passed
   */
  async registerForEvent(eventId: string, facultyId: string): Promise<EventParticipationDTO> {
    // Get faculty's department
    const facultyResult = await this.db
      .select({ department: faculty.department })
      .from(faculty)
      .where(and(eq(faculty.id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    if (facultyResult.length === 0) {
      throw new Error('Faculty not found');
    }

    const facultyDepartment = facultyResult[0].department;

    // Fetch event
    const eventResult = await this.db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), isNull(events.deleted_at)))
      .limit(1);

    if (eventResult.length === 0) {
      throw new EventNotFoundError(eventId);
    }

    const event = eventResult[0];

    // Validate event belongs to faculty's department
    if (event.department_id !== facultyDepartment) {
      throw new EventAccessDeniedError();
    }

    // Check if faculty is already registered
    const existingParticipation = await this.db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.event_id, eventId),
          eq(eventParticipants.faculty_id, facultyId)
        )
      )
      .limit(1);

    if (existingParticipation.length > 0) {
      throw new AlreadyRegisteredError();
    }

    // Validate registration deadline
    if (event.registration_deadline) {
      const today = new Date().toISOString().split('T')[0];
      if (event.registration_deadline < today) {
        throw new RegistrationDeadlinePassedError();
      }
    }

    // Validate event capacity
    if (event.max_participants) {
      const participantCount = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(eventParticipants)
        .where(eq(eventParticipants.event_id, eventId));

      const currentCount = Number(participantCount[0]?.count || 0);

      if (currentCount >= event.max_participants) {
        throw new EventFullError();
      }
    }

    // Create participation record
    const newParticipation = await this.db
      .insert(eventParticipants)
      .values({
        event_id: eventId,
        faculty_id: facultyId,
        participation_role: 'participant',
        attendance_status: 'registered',
      })
      .returning();

    const participation = newParticipation[0];

    return {
      event_id: eventId,
      event_name: event.event_name,
      event_type: event.event_type,
      event_date: event.event_date,
      location: event.location,
      registration_date: participation.created_at.toISOString(),
      attendance_status: participation.attendance_status || 'registered',
      participation_role: participation.participation_role,
    };
  }

  /**
   * Build EventDTO from database entity
   * 
   * Constructs the DTO with registration status and faculty's registration state.
   * 
   * @param eventEntity - Event database entity
   * @param facultyId - The faculty UUID to check registration status
   * @returns EventDTO with registration status
   */
  private async buildEventDTO(eventEntity: any, facultyId: string): Promise<EventDTO> {
    // Check if faculty is registered
    const registration = await this.db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.event_id, eventEntity.id),
          eq(eventParticipants.faculty_id, facultyId)
        )
      )
      .limit(1);

    const isRegistered = registration.length > 0;

    // Determine registration status
    let registrationStatus: 'open' | 'closed' | 'full' = 'open';

    // Check if registration deadline passed
    if (eventEntity.registration_deadline) {
      const today = new Date().toISOString().split('T')[0];
      if (eventEntity.registration_deadline < today) {
        registrationStatus = 'closed';
      }
    }

    // Check if event is full
    if (eventEntity.max_participants && registrationStatus === 'open') {
      const participantCount = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(eventParticipants)
        .where(eq(eventParticipants.event_id, eventEntity.id));

      const currentCount = Number(participantCount[0]?.count || 0);

      if (currentCount >= eventEntity.max_participants) {
        registrationStatus = 'full';
      }
    }

    return {
      id: eventEntity.id,
      title: eventEntity.event_name,
      description: eventEntity.description,
      event_type: eventEntity.event_type,
      event_date: eventEntity.event_date,
      location: eventEntity.location,
      organizer: eventEntity.organizer,
      max_participants: eventEntity.max_participants,
      registration_deadline: eventEntity.registration_deadline,
      registration_status: registrationStatus,
      is_registered: isRegistered,
    };
  }
}
