/**
 * Event Repository
 * Database access layer for event operations
 * 
 * Requirements: 11.1, 11.3, 11.4, 11.6, 28.4
 */

import { eq, and, isNull, like, sql, gte, lte } from 'drizzle-orm';
import { Database } from '../../../db';
import { events, eventParticipants } from '../../../db/schema';
import { students } from '../../../db/schema/students';
import { faculty } from '../../../db/schema/faculty';
import { EventFilters } from '../types';

export interface CreateEventData {
  id: string;
  event_name: string;
  event_type: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
}

export interface UpdateEventData {
  event_name?: string;
  event_type?: string;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
}

export interface CreateParticipantData {
  id: string;
  event_id: string;
  student_id?: string;
  faculty_id?: string;
  participation_role?: string;
  attendance_status?: string;
}

export class EventRepository {
  constructor(private db: Database) {}

  /**
   * Find event by UUID (excludes soft-deleted)
   * Requirement: 11.1
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(events)
      .where(and(eq(events.id, id), isNull(events.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find all events with pagination and filters (excludes soft-deleted)
   * Supports search by name and filtering by type and date range
   * Requirements: 11.1, 28.4
   */
  async findAll(filters?: EventFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [isNull(events.deleted_at)];

    // Search by event name
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(like(events.event_name, searchTerm));
    }

    // Filter by event type
    if (filters?.event_type) {
      conditions.push(eq(events.event_type, filters.event_type));
    }

    // Filter by date range
    if (filters?.start_date) {
      conditions.push(gte(events.event_date, filters.start_date));
    }

    if (filters?.end_date) {
      conditions.push(lte(events.event_date, filters.end_date));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(events)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(events.event_date);

    return {
      data: results,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new event
   * Requirement: 11.1
   */
  async create(data: CreateEventData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(events).values(data).returning();

    return result[0];
  }

  /**
   * Update event by ID
   * Requirement: 11.1
   */
  async update(id: string, data: UpdateEventData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(events)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Soft delete event by ID
   * Requirements: 11.1, 28.4
   */
  async softDelete(id: string) {
    await this.db
      .update(events)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(events.id, id));
  }

  /**
   * Get participant count for an event
   * Requirement: 11.6
   */
  async getParticipantCount(eventId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(eventParticipants)
      .where(eq(eventParticipants.event_id, eventId));

    return Number(result[0]?.count || 0);
  }

  /**
   * Add participant to event
   * Requirements: 11.3, 11.4
   */
  async addParticipant(data: CreateParticipantData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .insert(eventParticipants)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Remove participant from event
   * Requirement: 11.6
   */
  async removeParticipant(participantId: string, tx?: Database) {
    const dbInstance = tx || this.db;
    await dbInstance
      .delete(eventParticipants)
      .where(eq(eventParticipants.id, participantId));
  }

  /**
   * Get all participants for an event
   * Requirement: 11.6
   */
  async getParticipants(eventId: string) {
    const result = await this.db
      .select({
        participant: eventParticipants,
        student: students,
        faculty: faculty,
      })
      .from(eventParticipants)
      .leftJoin(students, eq(eventParticipants.student_id, students.id))
      .leftJoin(faculty, eq(eventParticipants.faculty_id, faculty.id))
      .where(eq(eventParticipants.event_id, eventId));

    return result;
  }

  /**
   * Find participant by ID
   * Requirement: 11.6
   */
  async findParticipantById(participantId: string) {
    const result = await this.db
      .select()
      .from(eventParticipants)
      .where(eq(eventParticipants.id, participantId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Check if participant already exists for event
   * Prevents duplicate registrations
   * Requirement: 11.3
   */
  async findExistingParticipant(eventId: string, studentId?: string, facultyId?: string) {
    const conditions = [eq(eventParticipants.event_id, eventId)];

    if (studentId) {
      conditions.push(eq(eventParticipants.student_id, studentId));
    }

    if (facultyId) {
      conditions.push(eq(eventParticipants.faculty_id, facultyId));
    }

    const result = await this.db
      .select()
      .from(eventParticipants)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }
}
