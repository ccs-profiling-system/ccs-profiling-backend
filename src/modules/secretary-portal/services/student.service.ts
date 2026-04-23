/**
 * Student Service
 * Business logic for student management operations
 * 
 * Requirements: 3.1-3.18, 17.3-17.5
 */

import { db } from '../../../db';
import { students, academicHistory } from '../../../db/schema';
import { eq, and, isNull, or, ilike, sql, SQL } from 'drizzle-orm';
import { StudentDTO, AcademicHistoryDTO, PaginationParams, PaginatedResponse } from '../types';
import { buildPaginationMeta, applyPagination } from '../utils/pagination';
import { logCreate, logUpdate, logDelete } from '../utils/auditLogger';
import { IDGenerator } from '../../../shared/utils/idGenerator';
import { entityCounterRepository } from '../../../db/repositories/entityCounter.repository';

/**
 * Filter options for student queries
 */
export interface StudentFilters {
  year_level?: number;
  program?: string;
  status?: string;
}

/**
 * Get all students with pagination, filtering, and search
 * 
 * @param pagination - Pagination parameters (page, limit)
 * @param filters - Filter options (year_level, program, status)
 * @param search - Search term for name and student_id
 * @returns Paginated list of students
 * 
 * Requirements: 3.1, 3.14-3.16
 */
export async function getAllStudents(
  pagination: PaginationParams,
  filters?: StudentFilters,
  search?: string
): Promise<PaginatedResponse<StudentDTO>> {
  const { page = 1, limit = 10 } = pagination;
  
  // Build where clause
  const whereConditions: SQL[] = [isNull(students.deleted_at)];
  
  // Apply filters
  if (filters?.year_level !== undefined) {
    whereConditions.push(eq(students.year_level, filters.year_level));
  }
  
  if (filters?.program) {
    whereConditions.push(eq(students.program, filters.program));
  }
  
  if (filters?.status) {
    whereConditions.push(eq(students.status, filters.status));
  }
  
  // Apply search
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(
      or(
        ilike(students.first_name, searchPattern),
        ilike(students.last_name, searchPattern),
        ilike(students.student_id, searchPattern)
      )!
    );
  }
  
  const whereClause = and(...whereConditions);
  
  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .where(whereClause);
  
  const total = countResult[0]?.count || 0;
  
  // Get paginated data
  const { limit: safeLimit, offset } = applyPagination(page, limit);
  
  const data = await db
    .select()
    .from(students)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset)
    .orderBy(students.last_name, students.first_name);
  
  // Build pagination metadata
  const meta = buildPaginationMeta(total, page, limit);
  
  return {
    data: data as StudentDTO[],
    meta,
  };
}

/**
 * Get student by ID
 * 
 * @param id - Student UUID
 * @returns Student record or null if not found
 * 
 * Requirements: 3.2
 */
export async function getStudentById(id: string): Promise<StudentDTO | null> {
  const result = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), isNull(students.deleted_at)))
    .limit(1);
  
  return result[0] ? (result[0] as StudentDTO) : null;
}

/**
 * Create a new student
 * student_id is auto-generated using the format: S-YYYY-0001
 * 
 * @param data - Student data (without student_id)
 * @param userId - ID of user creating the student
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Created student record
 * 
 * Requirements: 3.3, 3.11-3.13, 17.3-17.4
 */
export async function createStudent(
  data: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    year_level?: number;
    program?: string;
    status?: string;
    user_id?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<StudentDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Auto-generate student_id
    const currentYear = IDGenerator.getCurrentYear();
    
    // Ensure counter exists for current year
    await entityCounterRepository.getOrCreateCounter('student', currentYear, tx);
    
    // Increment counter and get new sequence
    const sequence = await entityCounterRepository.incrementCounter('student', currentYear, tx);
    
    // Generate human-readable ID (e.g., S-2024-0001)
    const studentId = IDGenerator.generate('student', sequence, currentYear);
    
    // Create student record
    const [newStudent] = await tx
      .insert(students)
      .values({
        student_id: studentId,
        user_id: data.user_id || null,
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name || null,
        email: data.email,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth || null,
        address: data.address || null,
        year_level: data.year_level || null,
        program: data.program || null,
        status: data.status || 'active',
      })
      .returning();
    
    return newStudent;
  });
  
  // Log the creation action
  await logCreate(
    userId,
    'student',
    result.id,
    result as Record<string, any>,
    ipAddress,
    userAgent
  );
  
  return result as StudentDTO;
}

/**
 * Update a student
 * 
 * @param id - Student UUID
 * @param data - Updated student data
 * @param userId - ID of user updating the student
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Updated student record
 * 
 * Requirements: 3.4, 3.11-3.13, 17.3-17.5
 */
export async function updateStudent(
  id: string,
  data: {
    student_id?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    year_level?: number;
    program?: string;
    status?: string;
    user_id?: string;
  },
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<StudentDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Student not found');
    }
    
    const oldValues = existing[0];
    
    // Validate student_id uniqueness if being updated
    if (data.student_id && data.student_id !== oldValues.student_id) {
      const duplicate = await tx
        .select()
        .from(students)
        .where(eq(students.student_id, data.student_id))
        .limit(1);
      
      if (duplicate.length > 0) {
        throw new Error('Student ID already exists');
      }
    }
    
    // Update student record
    const [updated] = await tx
      .update(students)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(students.id, id))
      .returning();
    
    // TODO: Create Pending_Change record when pending_changes table exists
    // For now, updates are applied directly without approval workflow
    
    // Log the update action
    await logUpdate(
      userId,
      'student',
      id,
      oldValues as Record<string, any>,
      updated as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return updated;
  });
  
  return result as StudentDTO;
}

/**
 * Delete a student (soft delete)
 * 
 * @param id - Student UUID
 * @param userId - ID of user deleting the student
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Deleted student record
 * 
 * Requirements: 3.5, 17.3-17.4, 17.7
 */
export async function deleteStudent(
  id: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<StudentDTO> {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // Validate entity existence
    const existing = await tx
      .select()
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deleted_at)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Student not found');
    }
    
    const oldValues = existing[0];
    
    // Perform soft delete
    const [deleted] = await tx
      .update(students)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(students.id, id))
      .returning();
    
    // Log the deletion action
    await logDelete(
      userId,
      'student',
      id,
      oldValues as Record<string, any>,
      ipAddress,
      userAgent
    );
    
    return deleted;
  });
  
  return result as StudentDTO;
}

/**
 * Get academic history for a student
 * 
 * @param id - Student UUID
 * @returns List of academic history records
 * 
 * Requirements: 3.6
 */
export async function getAcademicHistory(id: string): Promise<AcademicHistoryDTO[]> {
  // Validate student exists
  const student = await getStudentById(id);
  
  if (!student) {
    throw new Error('Student not found');
  }
  
  // Get academic history records
  const records = await db
    .select()
    .from(academicHistory)
    .where(eq(academicHistory.student_id, id))
    .orderBy(academicHistory.academic_year, academicHistory.semester);
  
  return records as AcademicHistoryDTO[];
}
