/**
 * Faculty Portal - Roster Service
 * Business logic layer for class roster management
 * 
 * Handles student roster viewing for courses assigned to faculty members.
 * Validates course ownership before returning roster data.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { eq, and, isNull, asc } from 'drizzle-orm';
import { Database } from '../../../db';
import { enrollments, students } from '../../../db/schema';
import { StudentRosterDTO } from '../types';
import { validateCourseOwnership } from '../utils/courseOwnership';

export class RosterService {
  constructor(private db: Database) {}

  /**
   * Get student roster for a course
   * 
   * Retrieves the list of students enrolled in a specific course.
   * Validates that the course is assigned to the requesting faculty member
   * before returning roster data.
   * 
   * @param courseId - The instruction UUID (course ID)
   * @param facultyId - The faculty UUID to validate ownership
   * @returns Array of students enrolled in the course, ordered by last name then first name
   * @throws CourseNotFoundError if course doesn't exist (HTTP 404)
   * @throws CourseOwnershipError if course is not assigned to faculty (HTTP 403)
   * 
   * Requirements:
   * - 5.1: Endpoint protected by faculty.roster.read permission
   * - 5.2: Validate courseId is assigned to authenticated faculty
   * - 5.3: Return HTTP 403 if course not assigned to faculty
   * - 5.4: Return student details including student_id, student_number, first_name, last_name, email, year_level, enrollment_status
   * - 5.5: Order students by last_name then first_name
   * - 5.6: Return HTTP 404 if course doesn't exist
   * - 5.7: Return empty array if no enrolled students
   */
  async getRosterByCourse(
    courseId: string,
    facultyId: string
  ): Promise<StudentRosterDTO[]> {
    // Validate course ownership
    // This will throw CourseNotFoundError (404) if course doesn't exist
    // or CourseOwnershipError (403) if course is not assigned to faculty
    await validateCourseOwnership(courseId, facultyId);

    // Query enrollments table filtered by instruction_id
    // Join with students table for student details
    // Only include enrolled students (not dropped or completed)
    const roster = await this.db
      .select({
        student_id: students.id,
        student_number: students.student_id,
        first_name: students.first_name,
        last_name: students.last_name,
        email: students.email,
        year_level: students.year_level,
        enrollment_status: enrollments.enrollment_status,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.student_id, students.id))
      .where(
        and(
          eq(enrollments.instruction_id, courseId),
          eq(enrollments.enrollment_status, 'enrolled'),
          isNull(students.deleted_at)
        )
      )
      .orderBy(asc(students.last_name), asc(students.first_name));

    // Transform to StudentRosterDTO format
    return roster.map((record) => ({
      student_id: record.student_id,
      student_number: record.student_number,
      first_name: record.first_name,
      last_name: record.last_name,
      email: record.email,
      year_level: record.year_level,
      enrollment_status: record.enrollment_status,
    }));
  }
}
