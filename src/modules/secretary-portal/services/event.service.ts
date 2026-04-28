/**
 * Event Service
 * Business logic for event management operations with approval workflow
 * 
 */

import { db } from '../../../db';
import { events, eventParticipants } from '../../../db/schema';
import { eq, and, isNull, or, ilike, sql, SQL, gte, lte } from 'drizzle-orm';
import { EventDTO, EventParticipantDTO, PaginationParams, PaginatedResponse, ApprovalStatus, EventType } from '../types';
import { buildPaginationMeta, applyPagination } from '../utils/pagination';
import { logCreate, logUpdate, logDelete, logSubmit } from '../utils/auditLogger';
import { ValidationError } from '../../../shared/errors';

/**
 * Filter options for event queries
 */
export interface EventFilters {
  event_type?: EventType;
  status?: ApprovalStatus;
  start_date?: string;
  end_date?: string;
}

/**
 * Get all events with pagination, filtering, and search
 * 
 * @param pagination - Pagination parameters (page, limit)
 * @param filters - Filter options (event_type, status, date range)
 * @param search - Search term for event_name
 * @returns Paginated list of events
 * 
 */
export async function getAllEvents(
  pagination: PaginationParams,
  filters?: EventFilters,
  search?: string
): Promise<PaginatedResponse<EventDTO>> {
  const { page = 1, limit = 10 } = pagination;
  
  // Build where clause
  const whereConditions: SQL[] = [isNull(events.deleted_at)];
  
  // Apply filters
  if (filters?.event_type) {
    whereConditions.push(eq(events.event_type, filters.event_type));
  }
  
  if (filters?.status) {
    whereConditions.push(eq(events.status, filters.status));
  }
  
  if (filters?.start_date) {
    whereConditions.push(gte(events.event_date, filters.start_date));
  }
  
  if (filters?.end_date) {
    whereConditions.push(lte(events.event_date, filters.end_date));
  }
  
  // Apply search
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(ilike(events.event_name, searchPattern));
  }
  
  const whereClause = and(...whereConditions);
  
  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(whereClause);
  
  const total = countResult[0]?.count || 0;
  
  // Get paginated data
  const { limit: safeLimit, offset } = applyPagination(page, limit);
  
  const data = await db
    .select()
    .from(events)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset)
    .orderBy(events.event_date);
  
  // Build pagination metadata
  const meta = buildPaginationMeta(total, page, limit);
  
  return {
    data: data as EventDTO[],
    meta,
  };
}

/**
 * Get event by ID
 * 
 * @param id - Event UUID
 * @returns Event record or null if not found
 * 
 */
export async function getEventById(id: string): Promise<EventDTO | null> {
  const result = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), isNull(events.deleted_at)))
    .limit(1);
  
  return result[0] ? (result[0] as EventDTO) : null;
}

/**
 * Create a new event
 * 
 * @param data - Event data
 * @param userId - ID of user creating the event
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Created event record
 * 
 */
export async function createEvent(
  data: {
    event_name: string;
    event_type: EventType;
    event_date: string;
    location: string;
    description?: string;
    organizer?: string;
    registration_deadline?: string;
    max_participants?: number;
    contact_email?: string;
    contact_phone?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<EventDTO> {
  // Validate event_date is not in the past
  const eventDate = new Date(data.event_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (eventDate < today) {
    throw new ValidationError('Event date cannot be in the past');
  }
  
  // Validate registration_deadline is before event_date if provided
  if (data.registration_deadline) {
    const registrationDate = new Date(data.registration_deadline);
    if (registrationDate >= eventDate) {
      throw new ValidationError('Registration deadline must be before event date');
    }
  }
  
  // Validate max_participants is positive integer if provided
  if (data.max_participants !== undefined && data.max_participants <= 0) {
    throw new ValidationError('Max participants must be a positive integer');
  }
  
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Create event record with initial status 'draft'
    const [newEvent] = await tx
      .insert(events)
      .values({
        event_name: data.event_name,
        event_type: data.event_type,
        event_date: data.event_date,
        location: data.location,
        description: data.description || null,
        organizer: data.organizer || null,
        registration_deadline: data.registration_deadline || null,
        max_participants: data.max_participants || null,
        status: 'draft', // Initial status
      })
      .returning();
    
    return newEvent;
  });
  
  // Log the creation action
  await logCreate(
    userId,
    'event',
    result.id,
    result as Record<string, any>,
    ipAddress,
    userAgent
  );
  
  return result as EventDTO;
}

/**
 * Update an event
 * 
 * @param id - Event UUID
 * @param data - Updated event data
 * @param userId - ID of user updating the event
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Updated event record
 * 
 */
export async function updateEvent(
  id: string,
  data: {
    event_name?: string;
    event_type?: EventType;
    event_date?: string;
    location?: string;
    description?: string;
    organizer?: string;
    registration_deadline?: string;
    max_participants?: number;
    contact_email?: string;
    contact_phone?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<EventDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(events)
      .where(and(eq(events.id, id), isNull(events.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new ValidationError('Event not found');
    }
    
    const oldValues = existing[0];
    
    // Prevent updates to events with status 'approved' or 'rejected'
    if (oldValues.status === 'approved' || oldValues.status === 'rejected') {
      throw new ValidationError(`Cannot update event with status '${oldValues.status}'`);
    }
    
    // Validate registration_deadline is before event_date if both are provided
    if (data.registration_deadline && data.event_date) {
      const registrationDate = new Date(data.registration_deadline);
      const eventDate = new Date(data.event_date);
      if (registrationDate >= eventDate) {
        throw new ValidationError('Registration deadline must be before event date');
      }
    }
    
    // Validate max_participants is positive integer if provided
    if (data.max_participants !== undefined && data.max_participants <= 0) {
      throw new ValidationError('Max participants must be a positive integer');
    }
    
    // Update event record
    const [updated] = await tx
      .update(events)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    
    // Log the update action
    await logUpdate(
      userId,
      'event',
      id,
      oldValues as Record<string, any>,
      updated as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return updated;
  });
  
  return result as EventDTO;
}

/**
 * Delete an event (soft delete)
 * 
 * @param id - Event UUID
 * @param userId - ID of user deleting the event
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Deleted event record
 * 
 */
export async function deleteEvent(
  id: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<EventDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(events)
      .where(and(eq(events.id, id), isNull(events.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new ValidationError('Event not found');
    }
    
    const oldValues = existing[0];
    
    // Prevent deletion of events with status 'approved' or 'pending_approval'
    if (oldValues.status === 'approved' || oldValues.status === 'pending_approval') {
      throw new ValidationError(`Cannot delete event with status '${oldValues.status}'`);
    }
    
    // Perform soft delete only for 'draft' status
    const [deleted] = await tx
      .update(events)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    
    // Log the deletion action
    await logDelete(
      userId,
      'event',
      id,
      oldValues as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return deleted;
  });
  
  return result as EventDTO;
}

/**
 * Submit an event for approval
 * 
 * Changes status from 'draft' to 'pending_approval'
 * 
 * @param id - Event UUID
 * @param userId - ID of user submitting the event
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Updated event record
 * 
 */
export async function submitEvent(
  id: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<EventDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(events)
      .where(and(eq(events.id, id), isNull(events.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new ValidationError('Event not found');
    }
    
    const oldValues = existing[0];
    
    // Validate state transition: only 'draft' can be submitted
    if (oldValues.status !== 'draft') {
      throw new ValidationError(`Cannot submit event with status '${oldValues.status}'. Only draft events can be submitted.`);
    }
    
    // Change status from 'draft' to 'pending_approval'
    const [updated] = await tx
      .update(events)
      .set({
        status: 'pending_approval',
        updated_at: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    
    return updated;
  });
  
  // Log the submission action
  await logSubmit(
    userId,
    'event',
    id,
    ipAddress,
    userAgent
  );
  
  return result as EventDTO;
}

/**
 * Get event participants
 * 
 * @param id - Event UUID
 * @returns List of event participants
 * 
 */
export async function getEventParticipants(id: string): Promise<EventParticipantDTO[]> {
  // Validate event exists
  const event = await getEventById(id);
  
  if (!event) {
    throw new ValidationError('Event not found');
  }
  
  // Get event participants
  const participants = await db
    .select()
    .from(eventParticipants)
    .where(eq(eventParticipants.event_id, id))
    .orderBy(eventParticipants.created_at);
  
  return participants as EventParticipantDTO[];
}
