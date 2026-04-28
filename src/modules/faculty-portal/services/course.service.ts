/**
 * Faculty Portal - Course Service
 * Business logic layer for course and teaching load management
 * 
 * Handles course assignments and teaching load tracking for faculty members
 */

import { eq, and, isNull, sql, count } from 'drizzle-orm';
import { Database } from '../../../db';
import { schedules, subjects, enrollments } from '../../../db/schema';
import { CourseDTO, TeachingLoadDTO } from '../types';

export class CourseService {
  constructor(private db: Database) {}

  /**
   * Get courses assigned to a faculty member
   * 
   * @param facultyId - The faculty UUID to filter by
   * @param semester - Optional semester filter (defaults to current semester)
   * @param year - Optional academic year filter (defaults to current year)
   * @returns Array of courses with enrollment counts
   */
  async getCoursesByFaculty(
    facultyId: string,
    semester?: string,
    year?: string
  ): Promise<CourseDTO[]> {
    // Default to current semester and year if not provided
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 0-indexed, so add 1
    const currentYear = currentDate.getFullYear();
    
    // Determine semester based on month if not provided
    const effectiveSemester = semester || this.getCurrentSemester(currentMonth);
    
    // Determine academic year if not provided
    // Academic year format: "2023-2024" (starts in August)
    const effectiveYear = year || this.getCurrentAcademicYear(currentMonth, currentYear);

    // TODO: This query needs refactoring - enrollments use instruction_id but schedules use subject_id
    // Temporarily simplified to work with current schema
    const coursesWithEnrollments = await this.db
      .select({
        id: schedules.subject_id,
        subject_code: subjects.code,
        subject_name: subjects.name,
        section: sql<string>`COALESCE(${schedules.room}, 'N/A')`.as('section'),
        schedule: sql<string>`${schedules.day} || ' ' || ${schedules.start_time} || '-' || ${schedules.end_time}`.as('schedule'),
        room: schedules.room,
        units: subjects.units,
        semester: schedules.semester,
        academic_year: schedules.academic_year,
        enrolled_count: sql<number>`0`.as('enrolled_count'), // TODO: Fix enrollment count
      })
      .from(schedules)
      .innerJoin(subjects, eq(schedules.subject_id, subjects.id))
      // TODO: Re-enable enrollment join after data model is fixed
      // .leftJoin(
      //   enrollments,
      //   and(
      //     eq(enrollments.instruction_id, schedules.subject_id), // MISMATCH
      //     eq(enrollments.semester, schedules.semester),
      //     eq(enrollments.academic_year, schedules.academic_year),
      //     eq(enrollments.enrollment_status, 'enrolled')
      //   )
      // )
      .where(
        and(
          eq(schedules.faculty_id, facultyId),
          eq(schedules.semester, effectiveSemester),
          eq(schedules.academic_year, effectiveYear),
          isNull(schedules.deleted_at),
          isNull(subjects.deleted_at)
        )
      )
      .groupBy(
        schedules.subject_id,
        subjects.code,
        subjects.name,
        schedules.room,
        schedules.day,
        schedules.start_time,
        schedules.end_time,
        subjects.units,
        schedules.semester,
        schedules.academic_year
      );

    // Transform to CourseDTO format
    return coursesWithEnrollments.map((course) => ({
      id: course.id || '',
      subject_code: course.subject_code,
      subject_name: course.subject_name,
      section: course.section,
      schedule: course.schedule,
      room: course.room || null,
      units: course.units,
      enrolled_student_count: Number(course.enrolled_count) || 0,
      semester: course.semester,
      academic_year: course.academic_year,
    }));
  }

  /**
   * Get teaching load summary for a faculty member
   * 
   * @param facultyId - The faculty UUID to filter by
   * @param semester - Optional semester filter (defaults to current semester)
   * @param year - Optional academic year filter (defaults to current year)
   * @returns Teaching load summary with total units and courses breakdown
   */
  async getTeachingLoad(
    facultyId: string,
    semester?: string,
    year?: string
  ): Promise<TeachingLoadDTO> {
    // Get courses for the faculty member
    const courses = await this.getCoursesByFaculty(facultyId, semester, year);

    // Calculate total units
    const totalUnits = courses.reduce((sum, course) => sum + course.units, 0);

    // Determine effective semester and year for response
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const effectiveSemester = semester || this.getCurrentSemester(currentMonth);
    const effectiveYear = year || this.getCurrentAcademicYear(currentMonth, currentYear);

    // Build teaching load response
    return {
      total_units: totalUnits,
      total_courses: courses.length,
      semester: effectiveSemester,
      academic_year: effectiveYear,
      courses: courses.map((course) => ({
        subject_code: course.subject_code,
        subject_name: course.subject_name,
        section: course.section,
        units: course.units,
      })),
    };
  }

  /**
   * Determine current semester based on month
   * 
   * @param month - Month number (1-12)
   * @returns Semester string ('1st', '2nd', or 'summer')
   */
  private getCurrentSemester(month: number): string {
    if (month >= 8 && month <= 12) {
      return '1st'; // August to December
    } else if (month >= 1 && month <= 5) {
      return '2nd'; // January to May
    } else {
      return 'summer'; // June to July
    }
  }

  /**
   * Determine current academic year based on month and year
   * 
   * @param month - Month number (1-12)
   * @param year - Current year
   * @returns Academic year string (e.g., '2023-2024')
   */
  private getCurrentAcademicYear(month: number, year: number): string {
    if (month >= 8) {
      // August onwards: current year to next year
      return `${year}-${year + 1}`;
    } else {
      // January to July: previous year to current year
      return `${year - 1}-${year}`;
    }
  }
}
