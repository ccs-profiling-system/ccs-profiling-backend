/**
 * Faculty Service
 * 
 * Provides business logic for faculty management in the department chair portal.
 * All operations are department-scoped to ensure multi-tenant data isolation.
 * 
 * Features:
 * - List faculty with pagination and filtering
 * - Get individual faculty details
 * - Get faculty teaching load with current semester schedules
 * - Get faculty statistics (students taught, courses, research count)
 * 
 */

import { db } from '../../../db';
import { faculty, schedules, instructions, enrollments, researchAdvisers, students } from '../../../db/schema';
import { eq, and, isNull, or, ilike, sql } from 'drizzle-orm';
import { PaginatedResponse, PaginationParams } from '../types';

/**
 * Faculty filters for list queries
 */
export interface FacultyFilters extends PaginationParams {
  status?: string;
  search?: string;
}

/**
 * Faculty response DTO
 */
export interface FacultyDTO {
  id: string;
  faculty_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  phone: string | null;
  department: string;
  position: string | null;
  specialization: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Teaching load schedule item
 */
export interface TeachingLoadSchedule {
  id: string;
  schedule_type: string;
  room: string;
  day: string;
  start_time: string;
  end_time: string;
  semester: string;
  academic_year: string;
}

/**
 * Teaching load response
 */
export interface TeachingLoadDTO {
  faculty_id: string;
  faculty_name: string;
  current_semester: string;
  current_academic_year: string;
  schedules: TeachingLoadSchedule[];
  total_schedules: number;
}

/**
 * Faculty statistics response
 */
export interface FacultyStatsDTO {
  faculty_id: string;
  faculty_name: string;
  students_taught: number;
  courses_taught: number;
  research_count: number;
}

export class FacultyService {
  /**
   * Get current semester and academic year based on current date
   * 
   * Logic:
   * - Months 8-12: 1st semester
   * - Months 1-5: 2nd semester
   * - Months 6-7: summer
   * 
   * Academic year spans two calendar years (e.g., 2024-2025)
   */
  private getCurrentSemesterInfo(): { semester: string; academicYear: string } {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    let semester: string;
    let academicYear: string;

    if (month >= 8 && month <= 12) {
      // 1st semester: August to December
      semester = '1st';
      academicYear = `${year}-${year + 1}`;
    } else if (month >= 1 && month <= 5) {
      // 2nd semester: January to May
      semester = '2nd';
      academicYear = `${year - 1}-${year}`;
    } else {
      // Summer: June to July
      semester = 'summer';
      academicYear = `${year - 1}-${year}`;
    }

    return { semester, academicYear };
  }

  /**
   * List faculty with pagination and filtering
   * 
   * Supports filtering by:
   * - status: Filter by faculty status (active, inactive)
   * - search: Search by name or email (case-insensitive)
   * 
   * All results are scoped to the specified department.
   * 
   * @param departmentId - Department ID to scope the query
   * @param filters - Pagination and filter parameters
   * @returns Paginated list of faculty
   * 
   */
  async listFaculty(
    departmentId: string,
    filters: FacultyFilters
  ): Promise<PaginatedResponse<FacultyDTO>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions = [
      eq(faculty.department, departmentId),
      isNull(faculty.deleted_at),
    ];

    // Add status filter
    if (filters.status) {
      conditions.push(eq(faculty.status, filters.status));
    }

    // Add search filter (name or email)
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(faculty.first_name, searchPattern),
          ilike(faculty.last_name, searchPattern),
          ilike(faculty.email, searchPattern)
        )!
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(faculty)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    // Get paginated results
    const results = await db
      .select()
      .from(faculty)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${faculty.created_at} DESC`);

    return {
      data: results.map(this.toDTO),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get faculty by ID with department validation
   * 
   * Validates that the faculty member belongs to the specified department.
   * Returns null if faculty doesn't exist or is outside department scope.
   * 
   * @param id - Faculty ID
   * @param departmentId - Department ID to validate scope
   * @returns Faculty details or null if not found
   * 
   */
  async getFacultyById(id: string, departmentId: string): Promise<FacultyDTO | null> {
    const result = await db
      .select()
      .from(faculty)
      .where(
        and(
          eq(faculty.id, id),
          eq(faculty.department, departmentId),
          isNull(faculty.deleted_at)
        )
      )
      .limit(1);

    if (!result[0]) {
      return null;
    }

    return this.toDTO(result[0]);
  }

  /**
   * Get faculty teaching load with current semester schedules
   * 
   * Returns all schedules for the faculty member in the current semester.
   * Automatically determines current semester based on current date.
   * 
   * @param id - Faculty ID
   * @param departmentId - Department ID to validate scope
   * @returns Teaching load data or null if faculty not found
   * 
   */
  async getFacultyTeachingLoad(id: string, departmentId: string): Promise<TeachingLoadDTO | null> {
    // First validate faculty exists and belongs to department
    const facultyMember = await this.getFacultyById(id, departmentId);
    if (!facultyMember) {
      return null;
    }

    // Get current semester info
    const { semester, academicYear } = this.getCurrentSemesterInfo();

    // Query schedules for current semester
    const schedulesResult = await db
      .select({
        id: schedules.id,
        schedule_type: schedules.schedule_type,
        room: schedules.room,
        day: schedules.day,
        start_time: schedules.start_time,
        end_time: schedules.end_time,
        semester: schedules.semester,
        academic_year: schedules.academic_year,
      })
      .from(schedules)
      .where(
        and(
          eq(schedules.faculty_id, id),
          eq(schedules.semester, semester),
          eq(schedules.academic_year, academicYear),
          isNull(schedules.deleted_at)
        )
      )
      .orderBy(schedules.day, schedules.start_time);

    return {
      faculty_id: facultyMember.id,
      faculty_name: `${facultyMember.first_name} ${facultyMember.last_name}`,
      current_semester: semester,
      current_academic_year: academicYear,
      schedules: schedulesResult,
      total_schedules: schedulesResult.length,
    };
  }

  /**
   * Get faculty statistics
   * 
   * Calculates:
   * - Students taught: Distinct students enrolled in courses taught by faculty
   * - Courses taught: Distinct schedules for the faculty member
   * - Research count: Research projects where faculty is an adviser
   * 
   * @param id - Faculty ID
   * @param departmentId - Department ID to validate scope
   * @returns Faculty statistics or null if faculty not found
   * 
   */
  async getFacultyStats(id: string, departmentId: string): Promise<FacultyStatsDTO | null> {
    // First validate faculty exists and belongs to department
    const facultyMember = await this.getFacultyById(id, departmentId);
    if (!facultyMember) {
      return null;
    }

    // Query 1: Count distinct students taught
    // Join: schedules -> instructions -> enrollments -> students
    const studentsTaughtResult = await db
      .select({ count: sql<number>`count(distinct ${students.id})::int` })
      .from(schedules)
      .innerJoin(instructions, eq(schedules.instruction_id, instructions.id))
      .innerJoin(enrollments, eq(enrollments.instruction_id, instructions.id))
      .innerJoin(students, eq(enrollments.student_id, students.id))
      .where(
        and(
          eq(schedules.faculty_id, id),
          isNull(schedules.deleted_at),
          isNull(instructions.deleted_at),
          isNull(students.deleted_at)
        )
      );

    // Query 2: Count distinct courses (schedules) taught
    const coursesTaughtResult = await db
      .select({ count: sql<number>`count(distinct ${schedules.id})::int` })
      .from(schedules)
      .where(
        and(
          eq(schedules.faculty_id, id),
          isNull(schedules.deleted_at)
        )
      );

    // Query 3: Count research projects as adviser
    const researchCountResult = await db
      .select({ count: sql<number>`count(distinct ${researchAdvisers.research_id})::int` })
      .from(researchAdvisers)
      .where(eq(researchAdvisers.faculty_id, id));

    return {
      faculty_id: facultyMember.id,
      faculty_name: `${facultyMember.first_name} ${facultyMember.last_name}`,
      students_taught: studentsTaughtResult[0]?.count || 0,
      courses_taught: coursesTaughtResult[0]?.count || 0,
      research_count: researchCountResult[0]?.count || 0,
    };
  }

  /**
   * Transform database entity to DTO
   */
  private toDTO(facultyRecord: any): FacultyDTO {
    return {
      id: facultyRecord.id,
      faculty_id: facultyRecord.faculty_id,
      user_id: facultyRecord.user_id,
      first_name: facultyRecord.first_name,
      last_name: facultyRecord.last_name,
      middle_name: facultyRecord.middle_name,
      email: facultyRecord.email,
      phone: facultyRecord.phone,
      department: facultyRecord.department,
      position: facultyRecord.position,
      specialization: facultyRecord.specialization,
      status: facultyRecord.status || 'active',
      created_at: facultyRecord.created_at.toISOString(),
      updated_at: facultyRecord.updated_at.toISOString(),
    };
  }
}
