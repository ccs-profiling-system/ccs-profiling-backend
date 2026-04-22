/**
 * Faculty Portal - Attendance Service
 * Business logic layer for attendance management
 * 
 * Handles attendance record viewing and submission for courses assigned to faculty members.
 * Validates course ownership and student enrollment before processing attendance records.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14, 6.15, 6.16
 */

import { eq, and, isNull, gte, lte, inArray } from 'drizzle-orm';
import { Database } from '../../../db';
import { attendance, students, enrollments } from '../../../db/schema';
import { AttendanceRecordDTO, AttendanceStatus } from '../types';
import { validateCourseOwnership } from '../utils/courseOwnership';
import { auditLogRepository } from '../../audit-logs';

/**
 * Invalid student error
 * Thrown when a student_id is not enrolled in the course
 */
export class InvalidStudentError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = 'INVALID_STUDENT';
  public readonly invalidStudentIds: string[];

  constructor(invalidStudentIds: string[]) {
    super(`The following student IDs are not enrolled in this course: ${invalidStudentIds.join(', ')}`);
    this.name = 'InvalidStudentError';
    this.invalidStudentIds = invalidStudentIds;
    Object.setPrototypeOf(this, InvalidStudentError.prototype);
  }
}

/**
 * Invalid attendance status error
 * Thrown when an invalid status value is provided
 */
export class InvalidAttendanceStatusError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = 'INVALID_ATTENDANCE_STATUS';

  constructor(status: string) {
    super(`Invalid attendance status: ${status}. Must be one of: present, absent, late, excused`);
    this.name = 'InvalidAttendanceStatusError';
    Object.setPrototypeOf(this, InvalidAttendanceStatusError.prototype);
  }
}

/**
 * Attendance record input for submission
 */
export interface AttendanceRecordInput {
  student_id: string;
  status: AttendanceStatus;
  remarks?: string;
}

/**
 * Attendance submission result
 */
export interface AttendanceSubmissionResult {
  success: boolean;
  recordsSaved: number;
  message: string;
}

export class AttendanceService {
  constructor(private db: Database) {}

  /**
   * Get attendance records for a course with date filtering
   * 
   * Retrieves attendance records for a specific course within a date range.
   * Validates that the course is assigned to the requesting faculty member.
   * Defaults to current month if date range is not provided.
   * 
   * @param courseId - The instruction UUID (course ID)
   * @param facultyId - The faculty UUID to validate ownership
   * @param dateFrom - Optional start date (YYYY-MM-DD format)
   * @param dateTo - Optional end date (YYYY-MM-DD format)
   * @returns Array of attendance records with student names
   * @throws CourseNotFoundError if course doesn't exist (HTTP 404)
   * @throws CourseOwnershipError if course is not assigned to faculty (HTTP 403)
   * 
   * Requirements:
   * - 6.1: Endpoint protected by faculty.attendance.read permission
   * - 6.2: Validate courseId is assigned to authenticated faculty
   * - 6.3: Accept optional date_from and date_to query parameters
   * - 6.4: Default to current month if date parameters not provided
   * - 6.5: Return records including date, student_id, student_name, status, remarks
   * - 6.6: Return HTTP 403 if course not assigned to faculty
   */
  async getAttendanceRecords(
    courseId: string,
    facultyId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AttendanceRecordDTO[]> {
    // Validate course ownership
    await validateCourseOwnership(courseId, facultyId);

    // Default to current month if date range not provided
    const now = new Date();
    const defaultDateFrom = dateFrom || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultDateTo = dateTo || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Query attendance table with date filtering
    // Join with students table for student names
    const records = await this.db
      .select({
        id: attendance.id,
        date: attendance.date,
        student_id: attendance.student_id,
        student_first_name: students.first_name,
        student_last_name: students.last_name,
        status: attendance.status,
        remarks: attendance.remarks,
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.student_id, students.id))
      .where(
        and(
          eq(attendance.instruction_id, courseId),
          gte(attendance.date, defaultDateFrom),
          lte(attendance.date, defaultDateTo),
          isNull(students.deleted_at)
        )
      )
      .orderBy(attendance.date, students.last_name, students.first_name);

    // Transform to AttendanceRecordDTO format
    return records.map((record) => ({
      id: record.id,
      date: record.date,
      student_id: record.student_id,
      student_name: `${record.student_first_name} ${record.student_last_name}`,
      status: record.status as AttendanceStatus,
      remarks: record.remarks,
    }));
  }

  /**
   * Submit attendance records for a course
   * 
   * Creates or updates attendance records for multiple students on a specific date.
   * Validates course ownership, student enrollment, and attendance status values.
   * Creates an audit log entry for the submission.
   * 
   * @param courseId - The instruction UUID (course ID)
   * @param facultyId - The faculty UUID to validate ownership
   * @param date - The attendance date (YYYY-MM-DD format)
   * @param records - Array of attendance records to submit
   * @param userId - The user ID of the faculty member submitting attendance
   * @returns Confirmation with number of records saved
   * @throws CourseNotFoundError if course doesn't exist (HTTP 404)
   * @throws CourseOwnershipError if course is not assigned to faculty (HTTP 403)
   * @throws InvalidStudentError if any student_id is not enrolled in the course (HTTP 400)
   * @throws InvalidAttendanceStatusError if any status is invalid (HTTP 400)
   * 
   * Requirements:
   * - 6.7: Endpoint protected by faculty.attendance.submit permission
   * - 6.8: Validate courseId is assigned to authenticated faculty
   * - 6.9: Require date and attendance_records array in request body
   * - 6.10: Validate each record contains student_id and status
   * - 6.11: Validate status is one of: present, absent, late, excused
   * - 6.12: Accept optional remarks field for each record
   * - 6.13: Validate all student_ids belong to enrolled students
   * - 6.14: Return HTTP 400 if invalid student_id provided
   * - 6.15: Return confirmation with number of records saved
   * - 6.16: Return HTTP 403 if course not assigned to faculty
   * - 12.1: Create audit log entry for attendance submission
   */
  async submitAttendanceRecords(
    courseId: string,
    facultyId: string,
    date: string,
    records: AttendanceRecordInput[],
    userId: string
  ): Promise<AttendanceSubmissionResult> {
    // Validate course ownership
    await validateCourseOwnership(courseId, facultyId);

    // Validate status values
    const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
    for (const record of records) {
      if (!validStatuses.includes(record.status)) {
        throw new InvalidAttendanceStatusError(record.status);
      }
    }

    // Extract all student IDs from records
    const studentIds = records.map(r => r.student_id);

    // Validate all student_ids belong to enrolled students in this course
    const enrolledStudents = await this.db
      .select({
        student_id: enrollments.student_id,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.instruction_id, courseId),
          eq(enrollments.enrollment_status, 'enrolled'),
          inArray(enrollments.student_id, studentIds)
        )
      );

    const enrolledStudentIds = new Set(enrolledStudents.map(s => s.student_id));
    const invalidStudentIds = studentIds.filter(id => !enrolledStudentIds.has(id));

    if (invalidStudentIds.length > 0) {
      throw new InvalidStudentError(invalidStudentIds);
    }

    // Check for existing attendance records on this date
    const existingRecords = await this.db
      .select({
        id: attendance.id,
        student_id: attendance.student_id,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.instruction_id, courseId),
          eq(attendance.date, date),
          inArray(attendance.student_id, studentIds)
        )
      );

    const existingRecordMap = new Map(
      existingRecords.map(r => [r.student_id, r.id])
    );

    // Separate records into updates and inserts
    const recordsToUpdate: Array<{ id: string; status: string; remarks: string | null }> = [];
    const recordsToInsert: Array<{
      instruction_id: string;
      student_id: string;
      date: string;
      status: string;
      remarks: string | null;
      recorded_by: string;
    }> = [];

    for (const record of records) {
      const existingId = existingRecordMap.get(record.student_id);
      
      if (existingId) {
        // Update existing record
        recordsToUpdate.push({
          id: existingId,
          status: record.status,
          remarks: record.remarks || null,
        });
      } else {
        // Insert new record
        recordsToInsert.push({
          instruction_id: courseId,
          student_id: record.student_id,
          date,
          status: record.status,
          remarks: record.remarks || null,
          recorded_by: userId,
        });
      }
    }

    // Perform bulk operations
    let recordsSaved = 0;

    // Bulk insert new records
    if (recordsToInsert.length > 0) {
      await this.db.insert(attendance).values(recordsToInsert);
      recordsSaved += recordsToInsert.length;
    }

    // Bulk update existing records
    for (const record of recordsToUpdate) {
      await this.db
        .update(attendance)
        .set({
          status: record.status,
          remarks: record.remarks,
          updated_at: new Date(),
        })
        .where(eq(attendance.id, record.id));
      recordsSaved++;
    }

    // Create audit log entry
    await auditLogRepository.create({
      user_id: userId,
      action_type: 'attendance_submit',
      entity_type: 'attendance',
      entity_id: courseId,
      after_state: {
        date,
        records_count: recordsSaved,
        student_ids: studentIds,
      },
    });

    return {
      success: true,
      recordsSaved,
      message: `Successfully saved ${recordsSaved} attendance record(s) for ${date}`,
    };
  }
}
