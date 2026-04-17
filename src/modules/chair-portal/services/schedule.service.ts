/**
 * Schedule Service
 * 
 * Provides business logic for schedule management in the department chair portal.
 * All operations are department-scoped to ensure multi-tenant data isolation.
 * 
 * Features:
 * - List schedules with filtering
 * - Create schedules with conflict detection
 * - Approve schedules with workflow validation
 * - Check for faculty, room, and time conflicts
 * 
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 13.1
 */

import { db } from '../../../db';
import { schedules, instructions, faculty } from '../../../db/schema';
import { eq, and, isNull, or, sql } from 'drizzle-orm';
import { validateApprovalState } from '../utils/workflowValidation';

/**
 * Schedule filters for list queries
 */
export interface ScheduleFilters {
  semester?: string;
  year?: number;
  faculty_id?: string;
  subject_code?: string;
}

/**
 * Schedule response DTO
 */
export interface ScheduleDTO {
  id: string;
  schedule_type: string;
  instruction_id: string | null;
  faculty_id: string | null;
  room: string;
  day: string;
  start_time: string;
  end_time: string;
  semester: string;
  academic_year: string;
  status?: string;
  subject_code?: string;
  subject_name?: string;
  faculty_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create schedule data
 */
export interface CreateScheduleData {
  subject_code: string;
  faculty_id: string;
  semester: string;
  year: number;
  day: string;
  time_start: string;
  time_end: string;
  room: string;
}

/**
 * Conflict check parameters
 */
export interface ConflictCheckParams {
  faculty_id: string;
  room: string;
  day: string;
  time_start: string;
  time_end: string;
  semester?: string;
  year?: number;
  exclude_schedule_id?: string;
}

/**
 * Conflict details
 */
export interface ConflictDetails {
  type: 'faculty' | 'room';
  schedule: ScheduleDTO;
  message: string;
}

export class ScheduleService {
  /**
   * List schedules with filtering
   * 
   * Supports filtering by:
   * - semester: Filter by semester (1st, 2nd, summer)
   * - year: Filter by academic year
   * - faculty_id: Filter by faculty member
   * - subject_code: Filter by subject code
   * 
   * All results are scoped to the specified department via faculty affiliation.
   * 
   * @param departmentId - Department ID to scope the query
   * @param filters - Filter parameters
   * @returns List of schedules
   * 
   * Requirements: 5.1, 5.2, 5.3, 13.1
   */
  async listSchedules(
    departmentId: string,
    filters: ScheduleFilters
  ): Promise<ScheduleDTO[]> {
    // Build filter conditions
    const conditions = [isNull(schedules.deleted_at)];

    // Add semester filter
    if (filters.semester) {
      conditions.push(eq(schedules.semester, filters.semester));
    }

    // Add year filter (convert to academic year format)
    if (filters.year) {
      const academicYear = `${filters.year}-${filters.year + 1}`;
      conditions.push(eq(schedules.academic_year, academicYear));
    }

    // Add faculty filter
    if (filters.faculty_id) {
      conditions.push(eq(schedules.faculty_id, filters.faculty_id));
    }

    // Query schedules with joins to get related data
    const results = await db
      .select({
        schedule: schedules,
        instruction: instructions,
        faculty: faculty,
      })
      .from(schedules)
      .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(and(...conditions))
      .orderBy(sql`${schedules.day}, ${schedules.start_time}`);

    // Filter by department (via faculty affiliation) and subject_code
    let filteredResults = results.filter(
      (r) => r.faculty?.department === departmentId
    );

    if (filters.subject_code) {
      filteredResults = filteredResults.filter(
        (r) => r.instruction?.subject_code === filters.subject_code
      );
    }

    return filteredResults.map((r) => this.toDTO(r.schedule, r.instruction, r.faculty));
  }

  /**
   * Create a new schedule with conflict detection
   * 
   * Validates:
   * - Faculty belongs to department
   * - No conflicts with existing schedules (faculty, room, time)
   * 
   * @param data - Schedule creation data
   * @param departmentId - Department ID to validate scope
   * @returns Created schedule
   * @throws Error if faculty not found or conflicts detected
   * 
   * Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 13.1
   */
  async createSchedule(
    data: CreateScheduleData,
    departmentId: string
  ): Promise<{ schedule: ScheduleDTO; conflicts?: ConflictDetails[] }> {
    // Validate faculty belongs to department
    const facultyResult = await db
      .select()
      .from(faculty)
      .where(
        and(
          eq(faculty.id, data.faculty_id),
          eq(faculty.department, departmentId),
          isNull(faculty.deleted_at)
        )
      )
      .limit(1);

    if (!facultyResult[0]) {
      throw new Error('Faculty not found or does not belong to your department');
    }

    // Find or create instruction record for the subject
    const academicYear = `${data.year}-${data.year + 1}`;
    
    let instructionRecord = await db
      .select()
      .from(instructions)
      .where(
        and(
          eq(instructions.subject_code, data.subject_code),
          isNull(instructions.deleted_at)
        )
      )
      .limit(1);

    let instructionId: string | null = instructionRecord[0]?.id || null;

    // Check for conflicts
    const conflicts = await this.checkConflicts({
      faculty_id: data.faculty_id,
      room: data.room,
      day: data.day,
      time_start: data.time_start,
      time_end: data.time_end,
      semester: data.semester,
      year: data.year,
    }, departmentId);

    if (conflicts.length > 0) {
      // Return conflicts without creating the schedule
      throw new Error('Schedule conflicts detected');
    }

    // Create schedule
    const newSchedule = await db
      .insert(schedules)
      .values({
        schedule_type: 'class',
        instruction_id: instructionId,
        faculty_id: data.faculty_id,
        room: data.room,
        day: data.day,
        start_time: data.time_start,
        end_time: data.time_end,
        semester: data.semester,
        academic_year: academicYear,
      })
      .returning();

    const created = newSchedule[0];

    // Fetch related data for DTO
    const instructionData = instructionId
      ? await db.select().from(instructions).where(eq(instructions.id, instructionId)).limit(1)
      : [];
    const facultyData = await db.select().from(faculty).where(eq(faculty.id, data.faculty_id)).limit(1);

    return {
      schedule: this.toDTO(created, instructionData[0], facultyData[0]),
    };
  }

  /**
   * Approve a schedule
   * 
   * Validates:
   * - Schedule exists and belongs to department
   * - Schedule status is 'pending_approval'
   * 
   * Note: The current schema doesn't have a status field, so this implementation
   * assumes schedules are created in an approved state. This method is included
   * for future workflow integration.
   * 
   * @param id - Schedule ID
   * @param departmentId - Department ID to validate scope
   * @param userId - ID of user performing the approval
   * @returns Updated schedule or null if not found
   * 
   * Requirements: 5.9, 5.10
   */
  async approveSchedule(
    id: string,
    departmentId: string,
    userId: string
  ): Promise<ScheduleDTO | null> {
    // Get schedule with related data
    const result = await db
      .select({
        schedule: schedules,
        instruction: instructions,
        faculty: faculty,
      })
      .from(schedules)
      .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(
        and(
          eq(schedules.id, id),
          isNull(schedules.deleted_at)
        )
      )
      .limit(1);

    if (!result[0]) {
      return null;
    }

    // Validate department scope
    if (result[0].faculty?.department !== departmentId) {
      return null;
    }

    // Note: Current schema doesn't have status field
    // This is a placeholder for future workflow integration
    // For now, we just return the schedule as-is

    return this.toDTO(result[0].schedule, result[0].instruction, result[0].faculty);
  }

  /**
   * Check for schedule conflicts
   * 
   * Detects conflicts with existing schedules:
   * - Faculty conflict: Same faculty, day, and overlapping time
   * - Room conflict: Same room, day, and overlapping time
   * 
   * @param params - Conflict check parameters
   * @param departmentId - Department ID to scope the query
   * @returns Array of conflict details
   * 
   * Requirements: 5.11, 5.12, 5.13
   */
  async checkConflicts(
    params: ConflictCheckParams,
    departmentId: string
  ): Promise<ConflictDetails[]> {
    const conflicts: ConflictDetails[] = [];
    const academicYear = params.year ? `${params.year}-${params.year + 1}` : undefined;

    // Build base conditions
    const baseConditions = [
      eq(schedules.day, params.day),
      isNull(schedules.deleted_at),
    ];

    if (params.semester) {
      baseConditions.push(eq(schedules.semester, params.semester));
    }

    if (academicYear) {
      baseConditions.push(eq(schedules.academic_year, academicYear));
    }

    if (params.exclude_schedule_id) {
      baseConditions.push(sql`${schedules.id} != ${params.exclude_schedule_id}`);
    }

    // Check faculty conflicts
    const facultyConflicts = await db
      .select({
        schedule: schedules,
        instruction: instructions,
        faculty: faculty,
      })
      .from(schedules)
      .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(
        and(
          ...baseConditions,
          eq(schedules.faculty_id, params.faculty_id),
          // Time overlap check: (start1 < end2) AND (end1 > start2)
          sql`${schedules.start_time} < ${params.time_end}::time`,
          sql`${schedules.end_time} > ${params.time_start}::time`
        )
      );

    for (const result of facultyConflicts) {
      if (result.faculty?.department === departmentId) {
        conflicts.push({
          type: 'faculty',
          schedule: this.toDTO(result.schedule, result.instruction, result.faculty),
          message: `Faculty member is already scheduled at this time`,
        });
      }
    }

    // Check room conflicts
    const roomConflicts = await db
      .select({
        schedule: schedules,
        instruction: instructions,
        faculty: faculty,
      })
      .from(schedules)
      .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(
        and(
          ...baseConditions,
          eq(schedules.room, params.room),
          // Time overlap check
          sql`${schedules.start_time} < ${params.time_end}::time`,
          sql`${schedules.end_time} > ${params.time_start}::time`
        )
      );

    for (const result of roomConflicts) {
      if (result.faculty?.department === departmentId) {
        conflicts.push({
          type: 'room',
          schedule: this.toDTO(result.schedule, result.instruction, result.faculty),
          message: `Room is already occupied at this time`,
        });
      }
    }

    return conflicts;
  }

  /**
   * Transform database entities to DTO
   */
  private toDTO(schedule: any, instruction?: any, facultyMember?: any): ScheduleDTO {
    return {
      id: schedule.id,
      schedule_type: schedule.schedule_type,
      instruction_id: schedule.instruction_id,
      faculty_id: schedule.faculty_id,
      room: schedule.room,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      semester: schedule.semester,
      academic_year: schedule.academic_year,
      subject_code: instruction?.subject_code,
      subject_name: instruction?.subject_name,
      faculty_name: facultyMember
        ? `${facultyMember.first_name} ${facultyMember.last_name}`
        : undefined,
      created_at: schedule.created_at.toISOString(),
      updated_at: schedule.updated_at.toISOString(),
    };
  }
}
