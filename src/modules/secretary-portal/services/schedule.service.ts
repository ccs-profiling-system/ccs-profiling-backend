/**
 * Schedule Service
 * Business logic for schedule management operations
 * 
 */

import { db } from '../../../db';
import { schedules } from '../../../db/schema';
import { eq, and, isNull, sql, SQL } from 'drizzle-orm';
import { ScheduleDTO, PaginationParams, PaginatedResponse } from '../types';
import { buildPaginationMeta, applyPagination } from '../utils/pagination';
import { logCreate, logUpdate, logDelete } from '../utils/auditLogger';

/**
 * Filter options for schedule queries
 */
export interface ScheduleFilters {
  semester?: string;
  academic_year?: string;
  faculty_id?: string;
  room?: string;
}

/**
 * Get all schedules with pagination and filtering
 * 
 * @param pagination - Pagination parameters (page, limit)
 * @param filters - Filter options (semester, academic_year, faculty_id, room)
 * @returns Paginated list of schedules
 * 
 */
export async function getAllSchedules(
  pagination: PaginationParams,
  filters?: ScheduleFilters
): Promise<PaginatedResponse<ScheduleDTO>> {
  const { page = 1, limit = 10 } = pagination;
  
  // Build where clause
  const whereConditions: SQL[] = [isNull(schedules.deleted_at)];
  
  // Apply filters
  if (filters?.semester) {
    whereConditions.push(eq(schedules.semester, filters.semester));
  }
  
  if (filters?.academic_year) {
    whereConditions.push(eq(schedules.academic_year, filters.academic_year));
  }
  
  if (filters?.faculty_id) {
    whereConditions.push(eq(schedules.faculty_id, filters.faculty_id));
  }
  
  if (filters?.room) {
    whereConditions.push(eq(schedules.room, filters.room));
  }
  
  const whereClause = and(...whereConditions);
  
  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schedules)
    .where(whereClause);
  
  const total = countResult[0]?.count || 0;
  
  // Get paginated data
  const { limit: safeLimit, offset } = applyPagination(page, limit);
  
  const data = await db
    .select()
    .from(schedules)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset)
    .orderBy(schedules.academic_year, schedules.semester, schedules.day, schedules.start_time);
  
  // Build pagination metadata
  const meta = buildPaginationMeta(total, page, limit);
  
  return {
    data: data as ScheduleDTO[],
    meta,
  };
}

/**
 * Get schedule by ID
 * 
 * @param id - Schedule UUID
 * @returns Schedule record or null if not found
 * 
 */
export async function getScheduleById(id: string): Promise<ScheduleDTO | null> {
  const result = await db
    .select()
    .from(schedules)
    .where(and(eq(schedules.id, id), isNull(schedules.deleted_at)))
    .limit(1);
  
  return result[0] ? (result[0] as ScheduleDTO) : null;
}

/**
 * Create a new schedule
 * 
 * @param data - Schedule data
 * @param userId - ID of user creating the schedule
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Created schedule record
 * 
 */
export async function createSchedule(
  data: {
    instruction_id: string;
    faculty_id: string;
    room: string;
    day: string;
    start_time: string;
    end_time: string;
    semester: string;
    academic_year: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ScheduleDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate start_time before end_time
    const [startHour, startMinute] = data.start_time.split(':').map(Number);
    const [endHour, endMinute] = data.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (startMinutes >= endMinutes) {
      throw new Error('Start time must be before end time');
    }
    
    // Create schedule record
    const [newSchedule] = await tx
      .insert(schedules)
      .values({
        schedule_type: 'class', // Default to 'class' type
        instruction_id: data.instruction_id,
        faculty_id: data.faculty_id,
        room: data.room,
        day: data.day,
        start_time: data.start_time,
        end_time: data.end_time,
        semester: data.semester,
        academic_year: data.academic_year,
      })
      .returning();
    
    return newSchedule;
  });
  
  // Log the creation action (Requirement 5.17)
  await logCreate(
    userId,
    'schedule',
    result.id,
    result as Record<string, any>,
    ipAddress,
    userAgent
  );
  
  return result as ScheduleDTO;
}

/**
 * Update a schedule
 * 
 * @param id - Schedule UUID
 * @param data - Updated schedule data
 * @param userId - ID of user updating the schedule
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Updated schedule record
 * 
 */
export async function updateSchedule(
  id: string,
  data: {
    instruction_id?: string;
    faculty_id?: string;
    room?: string;
    day?: string;
    start_time?: string;
    end_time?: string;
    semester?: string;
    academic_year?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ScheduleDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, id), isNull(schedules.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Schedule not found');
    }
    
    const oldValues = existing[0];
    
    // Validate start_time before end_time if both are provided or one is being updated
    const startTime = data.start_time || oldValues.start_time;
    const endTime = data.end_time || oldValues.end_time;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (startMinutes >= endMinutes) {
      throw new Error('Start time must be before end time');
    }
    
    // Update schedule record
    const [updated] = await tx
      .update(schedules)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(schedules.id, id))
      .returning();
    
    // Log the update action (Requirement 5.17)
    await logUpdate(
      userId,
      'schedule',
      id,
      oldValues as Record<string, any>,
      updated as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return updated;
  });
  
  return result as ScheduleDTO;
}

/**
 * Delete a schedule (soft delete)
 * 
 * @param id - Schedule UUID
 * @param userId - ID of user deleting the schedule
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Deleted schedule record
 * 
 */
export async function deleteSchedule(
  id: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ScheduleDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, id), isNull(schedules.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Schedule not found');
    }
    
    const oldValues = existing[0];
    
    // Perform soft delete
    const [deleted] = await tx
      .update(schedules)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(schedules.id, id))
      .returning();
    
    // Log the deletion action (Requirement 5.17)
    await logDelete(
      userId,
      'schedule',
      id,
      oldValues as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return deleted;
  });
  
  return result as ScheduleDTO;
}
