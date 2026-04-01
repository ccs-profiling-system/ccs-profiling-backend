/**
 * Schedule Repository
 * Database access layer for schedule operations
 * 
 * Requirements: 13.1, 13.3, 13.5, 13.6, 28.4
 */

import { eq, and, isNull, sql, ne } from 'drizzle-orm';
import { Database } from '../../../db';
import { schedules, instructions, faculty } from '../../../db/schema';
import { ScheduleFilters, ConflictCheckParams } from '../types';

export interface CreateScheduleData {
  id?: string; // Optional UUID v7, generated if not provided
  schedule_type: string;
  instruction_id?: string;
  faculty_id?: string;
  room: string;
  day: string;
  start_time: string;
  end_time: string;
  semester: string;
  academic_year: string;
}

export interface UpdateScheduleData {
  schedule_type?: string;
  instruction_id?: string;
  faculty_id?: string;
  room?: string;
  day?: string;
  start_time?: string;
  end_time?: string;
  semester?: string;
  academic_year?: string;
}

export class ScheduleRepository {
  constructor(private db: Database) {}

  /**
   * Find schedule by UUID with related instruction and faculty data
   * Automatically excludes soft-deleted records
   * Requirement: 13.1
   */
  async findById(id: string) {
    const result = await this.db
      .select({
        schedule: schedules,
        instruction: instructions,
        faculty: faculty,
      })
      .from(schedules)
      .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(and(
        eq(schedules.id, id),
        isNull(schedules.deleted_at) // Soft delete filter
      ))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find schedules by room
   * Requirement: 13.5
   */
  async findByRoom(room: string) {
    return await this.db
      .select({
        schedule: schedules,
        instruction: instructions,
        faculty: faculty,
      })
      .from(schedules)
      .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(and(
        eq(schedules.room, room),
        isNull(schedules.deleted_at)
      ))
      .orderBy(schedules.day, schedules.start_time);
  }

  /**
   * Find schedules by faculty ID
   * Requirement: 13.6
   */
  async findByFacultyId(facultyId: string) {
    return await this.db
      .select({
        schedule: schedules,
        instruction: instructions,
        faculty: faculty,
      })
      .from(schedules)
      .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(and(
        eq(schedules.faculty_id, facultyId),
        isNull(schedules.deleted_at)
      ))
      .orderBy(schedules.day, schedules.start_time);
  }

  /**
   * Find all schedules with pagination and filters
   * Automatically excludes soft-deleted records
   * Requirements: 13.1, 28.4
   */
  async findAll(filters?: ScheduleFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [isNull(schedules.deleted_at)]; // Always exclude soft-deleted

    if (filters?.room) {
      conditions.push(eq(schedules.room, filters.room));
    }

    if (filters?.day) {
      conditions.push(eq(schedules.day, filters.day));
    }

    if (filters?.schedule_type) {
      conditions.push(eq(schedules.schedule_type, filters.schedule_type));
    }

    if (filters?.faculty_id) {
      conditions.push(eq(schedules.faculty_id, filters.faculty_id));
    }

    if (filters?.instruction_id) {
      conditions.push(eq(schedules.instruction_id, filters.instruction_id));
    }

    if (filters?.semester) {
      conditions.push(eq(schedules.semester, filters.semester));
    }

    if (filters?.academic_year) {
      conditions.push(eq(schedules.academic_year, filters.academic_year));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schedules)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results with instruction and faculty details
    const results = await this.db
      .select({
        schedule: schedules,
        instruction: instructions,
        faculty: faculty,
      })
      .from(schedules)
      .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(schedules.day, schedules.start_time);

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
   * Find conflicting schedules using interval overlap logic
   * Two intervals overlap if: start_time < existing_end_time AND end_time > existing_start_time
   * Requirements: 13.3, 13.4
   */
  async findConflicts(params: ConflictCheckParams) {
    const conditions = [
      eq(schedules.room, params.room),
      eq(schedules.day, params.day),
      eq(schedules.semester, params.semester),
      eq(schedules.academic_year, params.academic_year),
      isNull(schedules.deleted_at),
      // Interval overlap logic: start < existing_end AND end > existing_start
      sql`${schedules.start_time} < ${params.end_time}`,
      sql`${schedules.end_time} > ${params.start_time}`,
    ];

    // Exclude the schedule being updated (for update operations)
    if (params.excludeId) {
      conditions.push(ne(schedules.id, params.excludeId));
    }

    return await this.db
      .select({
        schedule: schedules,
        instruction: instructions,
        faculty: faculty,
      })
      .from(schedules)
      .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(and(...conditions));
  }

  /**
   * Create a new schedule
   * Requirement: 13.1
   */
  async create(data: CreateScheduleData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(schedules).values(data).returning();

    return result[0];
  }

  /**
   * Update schedule by ID
   * Requirement: 13.1
   */
  async update(id: string, data: UpdateScheduleData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(schedules)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(schedules.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Soft delete schedule by ID
   * Requirement: 28.4
   */
  async softDelete(id: string) {
    await this.db
      .update(schedules)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(schedules.id, id));
  }
}
