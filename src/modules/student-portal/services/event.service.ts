/**
 * Student Portal - Event Service
 * Business logic layer for event management
 * 
 * Handles event browsing, registration, and unregistration.
 * Ensures students can only access their own registrations.
 * 
 * Requirements: 17.1-17.6, 18.1-18.4, 19.1-19.8, 20.1-20.6
 */

import { eq, and, gte, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { 
  events, 
  eventParticipants,
} from '../../../db/schema';
import { NotFoundError, ConflictError, ValidationError, UnprocessableEntityError } from '../../../shared/errors';
import { 
  EventDTO, 
  RegisteredEventDTO,
  PaginatedResponse,
  PaginationParams 
} from '../types';

export class EventService {
  constructor(private db: Database) {}

  /**
   * List upcoming events with pagination
   * 
   * Retrieves future events (event_date >= current date) with available slots calculation.
   * Supports pagination with configurable page size.
   * 
   * @param params - Pagination parameters (page, limit)
   * @returns Paginated list of upcoming events
   * 
   * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
   */
  async listUpcomingEvents(params: PaginationParams): Promise<PaginatedResponse<EventDTO>> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;
    const currentDate = new Date().toISOString().split('T')[0];

    // Count total upcoming events
    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(
        and(
          gte(events.event_date, currentDate),
          eq(events.deleted_at, sql`NULL`)
        )
      );

    const total = countResult[0]?.count || 0;

    // Fetch upcoming events with pagination
    const upcomingEvents = await this.db
      .select({
        id: events.id,
        event_name: events.event_name,
        description: events.description,
        event_type: events.event_type,
        event_date: events.event_date,
        location: events.location,
        organizer: events.organizer,
        registration_deadline: events.registration_deadline,
        max_participants: events.max_participants,
      })
      .from(events)
      .where(
        and(
          gte(events.event_date, currentDate),
          eq(events.deleted_at, sql`NULL`)
        )
      )
      .orderBy(events.event_date)
      .limit(limit)
      .offset(offset);

    // Count registered participants for each event
    const eventIds = upcomingEvents.map(e => e.id);
    const participantCounts = eventIds.length > 0
      ? await this.db
          .select({
            event_id: eventParticipants.event_id,
            count: sql<number>`count(*)::int`,
          })
          .from(eventParticipants)
          .where(
            and(
              sql`${eventParticipants.event_id} = ANY(${sql.raw(`ARRAY[${eventIds.map(id => `'${id}'`).join(',')}]::uuid[]`)})`,
              eq(eventParticipants.attendance_status, 'registered')
            )
          )
          .groupBy(eventParticipants.event_id)
      : [];

    const participantCountMap = new Map(
      participantCounts.map(pc => [pc.event_id, pc.count])
    );

    const data: EventDTO[] = upcomingEvents.map(event => {
      const registeredCount = participantCountMap.get(event.id) || 0;
      const availableSlots = event.max_participants 
        ? event.max_participants - registeredCount 
        : null;

      return {
        id: event.id,
        title: event.event_name,
        description: event.description,
        event_type: event.event_type,
        event_date: event.event_date,
        location: event.location,
        organizer: event.organizer,
        registration_deadline: event.registration_deadline,
        available_slots: availableSlots,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List events student has registered for
   * 
   * Retrieves events the student has registered for with status 'registered'.
   * Includes event details, registration date, and attendance status.
   * 
   * @param studentId - The student UUID
   * @returns List of registered events
   * 
   * Requirements: 18.1, 18.2, 18.3
   */
  async listRegisteredEvents(studentId: string): Promise<RegisteredEventDTO[]> {
    const registeredEvents = await this.db
      .select({
        id: events.id,
        event_name: events.event_name,
        description: events.description,
        event_type: events.event_type,
        event_date: events.event_date,
        location: events.location,
        organizer: events.organizer,
        registration_deadline: events.registration_deadline,
        max_participants: events.max_participants,
        registration_date: eventParticipants.created_at,
        attendance_status: eventParticipants.attendance_status,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.event_id, events.id))
      .where(
        and(
          eq(eventParticipants.student_id, studentId),
          eq(eventParticipants.attendance_status, 'registered'),
          eq(events.deleted_at, sql`NULL`)
        )
      )
      .orderBy(events.event_date);

    // Count registered participants for each event to calculate available slots
    const eventIds = registeredEvents.map(e => e.id);
    const participantCounts = eventIds.length > 0
      ? await this.db
          .select({
            event_id: eventParticipants.event_id,
            count: sql<number>`count(*)::int`,
          })
          .from(eventParticipants)
          .where(
            and(
              sql`${eventParticipants.event_id} = ANY(${sql.raw(`ARRAY[${eventIds.map(id => `'${id}'`).join(',')}]::uuid[]`)})`,
              eq(eventParticipants.attendance_status, 'registered')
            )
          )
          .groupBy(eventParticipants.event_id)
      : [];

    const participantCountMap = new Map(
      participantCounts.map(pc => [pc.event_id, pc.count])
    );

    return registeredEvents.map(event => {
      const registeredCount = participantCountMap.get(event.id) || 0;
      const availableSlots = event.max_participants 
        ? event.max_participants - registeredCount 
        : null;

      return {
        id: event.id,
        title: event.event_name,
        description: event.description,
        event_type: event.event_type,
        event_date: event.event_date,
        location: event.location,
        organizer: event.organizer,
        registration_deadline: event.registration_deadline,
        available_slots: availableSlots,
        registration_date: event.registration_date.toISOString().split('T')[0],
        attendance_status: event.attendance_status,
      };
    });
  }

  /**
   * Register student for an event
   * 
   * Validates registration deadline, event capacity, and duplicate registration.
   * Creates registration record with status 'registered'.
   * 
   * @param eventId - The event UUID
   * @param studentId - The student UUID
   * @throws ValidationError if registration deadline has passed
   * @throws UnprocessableEntityError if event is at maximum capacity
   * @throws ConflictError if student is already registered
   * 
   * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7
   */
  async registerForEvent(eventId: string, studentId: string): Promise<void> {
    // Check if event exists
    const eventResult = await this.db
      .select({
        id: events.id,
        event_name: events.event_name,
        registration_deadline: events.registration_deadline,
        max_participants: events.max_participants,
      })
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.deleted_at, sql`NULL`)
        )
      )
      .limit(1);

    const event = eventResult[0];

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Validate registration deadline has not passed
    if (event.registration_deadline) {
      const currentDate = new Date().toISOString().split('T')[0];
      if (event.registration_deadline < currentDate) {
        throw new ValidationError('Registration deadline has passed');
      }
    }

    // Check if student is already registered
    const existingRegistration = await this.db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.event_id, eventId),
          eq(eventParticipants.student_id, studentId),
          eq(eventParticipants.attendance_status, 'registered')
        )
      )
      .limit(1);

    if (existingRegistration.length > 0) {
      throw new ConflictError('You are already registered for this event');
    }

    // Check if event has reached maximum capacity
    if (event.max_participants) {
      const participantCountResult = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(eventParticipants)
        .where(
          and(
            eq(eventParticipants.event_id, eventId),
            eq(eventParticipants.attendance_status, 'registered')
          )
        );

      const currentParticipants = participantCountResult[0]?.count || 0;

      if (currentParticipants >= event.max_participants) {
        throw new UnprocessableEntityError('Event has reached maximum capacity');
      }
    }

    // Create registration record
    await this.db
      .insert(eventParticipants)
      .values({
        event_id: eventId,
        student_id: studentId,
        participation_role: 'participant',
        attendance_status: 'registered',
      });
  }

  /**
   * Unregister student from an event
   * 
   * Validates student is currently registered and event date has not passed.
   * Removes registration record.
   * 
   * @param eventId - The event UUID
   * @param studentId - The student UUID
   * @throws ValidationError if student is not registered or event date has passed
   * 
   * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
   */
  async unregisterFromEvent(eventId: string, studentId: string): Promise<void> {
    // Check if event exists and get event date
    const eventResult = await this.db
      .select({
        id: events.id,
        event_date: events.event_date,
      })
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.deleted_at, sql`NULL`)
        )
      )
      .limit(1);

    const event = eventResult[0];

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Validate event date has not passed
    const currentDate = new Date().toISOString().split('T')[0];
    if (event.event_date < currentDate) {
      throw new ValidationError('Cannot unregister from past events');
    }

    // Check if student is currently registered
    const existingRegistration = await this.db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.event_id, eventId),
          eq(eventParticipants.student_id, studentId),
          eq(eventParticipants.attendance_status, 'registered')
        )
      )
      .limit(1);

    if (existingRegistration.length === 0) {
      throw new ValidationError('You are not registered for this event');
    }

    // Remove registration record
    await this.db
      .delete(eventParticipants)
      .where(
        and(
          eq(eventParticipants.event_id, eventId),
          eq(eventParticipants.student_id, studentId)
        )
      );
  }
}
