/**
 * Course Ownership Validation Utilities
 * 
 * Utilities for validating that faculty members have ownership/assignment
 * to courses before allowing operations on course-related resources such as
 * rosters, attendance records, and course materials.
 * 
 * Requirements: 5.2, 6.2, 9.2, 13.6
 */

import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../../db';
import { schedules, instructions } from '../../../db/schema';

/**
 * Course not found error
 * Thrown when a course (instruction) does not exist
 */
export class CourseNotFoundError extends Error {
  public readonly statusCode: number = 404;
  public readonly code: string = 'COURSE_NOT_FOUND';

  constructor(courseId: string) {
    super(`Course with ID ${courseId} not found`);
    this.name = 'CourseNotFoundError';
    Object.setPrototypeOf(this, CourseNotFoundError.prototype);
  }
}

/**
 * Course ownership error
 * Thrown when faculty attempts to access a course not assigned to them
 */
export class CourseOwnershipError extends Error {
  public readonly statusCode: number = 403;
  public readonly code: string = 'COURSE_NOT_ASSIGNED';

  constructor(courseId: string) {
    super(`Access denied: Course ${courseId} is not assigned to you`);
    this.name = 'CourseOwnershipError';
    Object.setPrototypeOf(this, CourseOwnershipError.prototype);
  }
}

/**
 * Validate course ownership
 * 
 * Validates that a course (instruction) is assigned to the specified faculty member
 * by querying the schedules table which links instructions to faculty.
 * 
 * This function should be called before allowing operations on course-related
 * resources such as:
 * - Viewing student rosters
 * - Submitting attendance records
 * - Uploading/deleting course materials
 * 
 * @param courseId - UUID of the instruction/course
 * @param facultyId - UUID of the faculty member
 * @throws CourseNotFoundError if course doesn't exist (HTTP 404)
 * @throws CourseOwnershipError if course is not assigned to faculty (HTTP 403)
 * 
 * @example
 * ```typescript
 * // Before viewing roster
 * await validateCourseOwnership(courseId, facultyId);
 * const roster = await getRosterByCourse(courseId);
 * 
 * // Before submitting attendance
 * await validateCourseOwnership(courseId, facultyId);
 * await submitAttendance(courseId, attendanceRecords);
 * ```
 */
export async function validateCourseOwnership(
  courseId: string,
  facultyId: string
): Promise<void> {
  // First, check if the course (instruction) exists and is not soft-deleted
  const course = await db
    .select({ id: instructions.id })
    .from(instructions)
    .where(
      and(
        eq(instructions.id, courseId),
        isNull(instructions.deleted_at)
      )
    )
    .limit(1);

  if (course.length === 0) {
    throw new CourseNotFoundError(courseId);
  }

  // Check if the faculty is assigned to this course via schedules table
  // A faculty is considered assigned if there's at least one schedule entry
  // linking the instruction_id to their faculty_id
  const assignment = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(
      and(
        eq(schedules.instruction_id, courseId),
        eq(schedules.faculty_id, facultyId),
        isNull(schedules.deleted_at)
      )
    )
    .limit(1);

  if (assignment.length === 0) {
    throw new CourseOwnershipError(courseId);
  }

  // Validation passed - faculty has ownership of the course
}

/**
 * Check if faculty owns course (non-throwing version)
 * 
 * Checks if a faculty member is assigned to a course without throwing errors.
 * Useful for conditional logic where you need to check ownership without
 * handling exceptions.
 * 
 * @param courseId - UUID of the instruction/course
 * @param facultyId - UUID of the faculty member
 * @returns true if faculty owns the course, false otherwise
 * 
 * @example
 * ```typescript
 * const hasAccess = await checkCourseOwnership(courseId, facultyId);
 * if (hasAccess) {
 *   // Allow operation
 * } else {
 *   // Deny operation
 * }
 * ```
 */
export async function checkCourseOwnership(
  courseId: string,
  facultyId: string
): Promise<boolean> {
  try {
    await validateCourseOwnership(courseId, facultyId);
    return true;
  } catch (error) {
    return false;
  }
}
