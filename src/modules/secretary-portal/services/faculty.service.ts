/**
 * Faculty Service
 * Business logic for faculty management operations
 * 
 */

import { db } from '../../../db';
import { faculty, schedules, instructions, subjects } from '../../../db/schema';
import { eq, and, isNull, or, ilike, sql, SQL } from 'drizzle-orm';
import { FacultyDTO, PaginationParams, PaginatedResponse } from '../types';
import { buildPaginationMeta, applyPagination } from '../utils/pagination';
import { logCreate, logUpdate, logDelete } from '../utils/auditLogger';
import { IDGenerator } from '../../../shared/utils/idGenerator';
import { entityCounterRepository } from '../../../db/repositories/entityCounter.repository';

/**
 * Filter options for faculty queries
 */
export interface FacultyFilters {
  department?: string;
  position?: string;
  status?: string;
}

/**
 * Teaching load item with schedule and subject details
 */
export interface TeachingLoadItem {
  schedule_id: string;
  instruction_id: string | null;
  subject_code: string;
  subject_name: string;
  room: string;
  day: string;
  start_time: string;
  end_time: string;
  semester: string;
  academic_year: string;
}

/**
 * Get all faculty with pagination, filtering, and search
 * 
 * @param pagination - Pagination parameters (page, limit)
 * @param filters - Filter options (department, position, status)
 * @param search - Search term for name and faculty_id
 * @returns Paginated list of faculty
 * 
 */
export async function getAllFaculty(
  pagination: PaginationParams,
  filters?: FacultyFilters,
  search?: string
): Promise<PaginatedResponse<FacultyDTO>> {
  const { page = 1, limit = 10 } = pagination;
  
  // Build where clause
  const whereConditions: SQL[] = [isNull(faculty.deleted_at)];
  
  // Apply filters
  if (filters?.department) {
    whereConditions.push(eq(faculty.department, filters.department));
  }
  
  if (filters?.position) {
    whereConditions.push(eq(faculty.position, filters.position));
  }
  
  if (filters?.status) {
    whereConditions.push(eq(faculty.status, filters.status));
  }
  
  // Apply search
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(
      or(
        ilike(faculty.first_name, searchPattern),
        ilike(faculty.last_name, searchPattern),
        ilike(faculty.faculty_id, searchPattern)
      )!
    );
  }
  
  const whereClause = and(...whereConditions);
  
  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(faculty)
    .where(whereClause);
  
  const total = countResult[0]?.count || 0;
  
  // Get paginated data
  const { limit: safeLimit, offset } = applyPagination(page, limit);
  
  const data = await db
    .select()
    .from(faculty)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset)
    .orderBy(faculty.last_name, faculty.first_name);
  
  // Build pagination metadata
  const meta = buildPaginationMeta(total, page, limit);
  
  return {
    data: data as FacultyDTO[],
    meta,
  };
}

/**
 * Get faculty by ID
 * 
 * @param id - Faculty UUID
 * @returns Faculty record or null if not found
 * 
 */
export async function getFacultyById(id: string): Promise<FacultyDTO | null> {
  const result = await db
    .select()
    .from(faculty)
    .where(and(eq(faculty.id, id), isNull(faculty.deleted_at)))
    .limit(1);
  
  return result[0] ? (result[0] as FacultyDTO) : null;
}

/**
 * Create a new faculty member
 * faculty_id is auto-generated using the format: F-YYYY-0001
 * 
 * @param data - Faculty data (without faculty_id)
 * @param userId - ID of user creating the faculty
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Created faculty record
 * 
 */
export async function createFaculty(
  data: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    phone?: string;
    department: string;
    position?: string;
    specialization?: string;
    office_location?: string;
    consultation_hours?: string;
    bio?: string;
    status?: string;
    user_id?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<FacultyDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Auto-generate faculty_id
    const currentYear = IDGenerator.getCurrentYear();
    
    // Ensure counter exists for current year
    await entityCounterRepository.getOrCreateCounter('faculty', currentYear, tx);
    
    // Increment counter and get new sequence
    const sequence = await entityCounterRepository.incrementCounter('faculty', currentYear, tx);
    
    // Generate human-readable ID (e.g., F-2024-0001)
    const facultyId = IDGenerator.generate('faculty', sequence, currentYear);
    
    // Create faculty record
    const [newFaculty] = await tx
      .insert(faculty)
      .values({
        faculty_id: facultyId,
        user_id: data.user_id || null,
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name || null,
        email: data.email,
        phone: data.phone || null,
        department: data.department,
        position: data.position || null,
        specialization: data.specialization || null,
        office_location: data.office_location || null,
        consultation_hours: data.consultation_hours || null,
        bio: data.bio || null,
        status: data.status || 'active',
      })
      .returning();
    
    return newFaculty;
  });
  
  // Log the creation action
  await logCreate(
    userId,
    'faculty',
    result.id,
    result as Record<string, any>,
    ipAddress,
    userAgent
  );
  
  return result as FacultyDTO;
}

/**
 * Update a faculty member
 * 
 * @param id - Faculty UUID
 * @param data - Updated faculty data
 * @param userId - ID of user updating the faculty
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Updated faculty record
 * 
 */
export async function updateFaculty(
  id: string,
  data: {
    faculty_id?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    email?: string;
    phone?: string;
    department?: string;
    position?: string;
    specialization?: string;
    office_location?: string;
    consultation_hours?: string;
    bio?: string;
    status?: string;
    user_id?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<FacultyDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(faculty)
      .where(and(eq(faculty.id, id), isNull(faculty.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Faculty not found');
    }
    
    const oldValues = existing[0];
    
    // Validate faculty_id uniqueness if being updated
    if (data.faculty_id && data.faculty_id !== oldValues.faculty_id) {
      const duplicate = await tx
        .select()
        .from(faculty)
        .where(eq(faculty.faculty_id, data.faculty_id))
        .limit(1);
      
      if (duplicate.length > 0) {
        throw new Error('Faculty ID already exists');
      }
    }
    
    // Update faculty record
    const [updated] = await tx
      .update(faculty)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(faculty.id, id))
      .returning();
    
    // TODO: Create Pending_Change record when pending_changes table exists
    // For now, updates are applied directly without approval workflow
    
    // Log the update action
    await logUpdate(
      userId,
      'faculty',
      id,
      oldValues as Record<string, any>,
      updated as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return updated;
  });
  
  return result as FacultyDTO;
}

/**
 * Delete a faculty member (soft delete)
 * 
 * @param id - Faculty UUID
 * @param userId - ID of user deleting the faculty
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Deleted faculty record
 * 
 */
export async function deleteFaculty(
  id: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<FacultyDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(faculty)
      .where(and(eq(faculty.id, id), isNull(faculty.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Faculty not found');
    }
    
    const oldValues = existing[0];
    
    // Perform soft delete
    const [deleted] = await tx
      .update(faculty)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(faculty.id, id))
      .returning();
    
    // Log the deletion action
    await logDelete(
      userId,
      'faculty',
      id,
      oldValues as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return deleted;
  });
  
  return result as FacultyDTO;
}

/**
 * Get teaching load for a faculty member
 * 
 * @param id - Faculty UUID
 * @returns List of teaching load items with schedule and instruction details
 * 
 */
export async function getTeachingLoad(id: string): Promise<TeachingLoadItem[]> {
  // Validate faculty exists
  const facultyMember = await getFacultyById(id);
  
  if (!facultyMember) {
    throw new Error('Faculty not found');
  }
  
  // Get teaching load by joining schedules with instructions and subjects
  const teachingLoad = await db
    .select({
      schedule_id: schedules.id,
      instruction_id: schedules.instruction_id,
      subject_code: subjects.code,
      subject_name: subjects.name,
      room: schedules.room,
      day: schedules.day,
      start_time: schedules.start_time,
      end_time: schedules.end_time,
      semester: schedules.semester,
      academic_year: schedules.academic_year,
    })
    .from(schedules)
    .innerJoin(instructions, eq(schedules.instruction_id, instructions.id))
    .innerJoin(subjects, eq(instructions.subject_code, subjects.code))
    .where(
      and(
        eq(schedules.faculty_id, id),
        isNull(schedules.deleted_at),
        isNull(instructions.deleted_at),
        isNull(subjects.deleted_at)
      )
    )
    .orderBy(schedules.academic_year, schedules.semester, schedules.day, schedules.start_time);
  
  return teachingLoad as TeachingLoadItem[];
}
