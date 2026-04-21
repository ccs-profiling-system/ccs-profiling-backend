/**
 * Faculty Portal - Participation Service
 * Business logic layer for student participation management
 * 
 * Handles participation record viewing and submission for courses assigned to faculty members.
 * Validates course ownership and student enrollment before processing participation records.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12, 10.13, 10.14
 */

import { eq, and, isNull, inArray } from 'drizzle-orm';
import { Database } from '../../../db';
import { studentParticipation, students, enrollments } from '../../../db/schema';
import { validateCourseOwnership } from '../utils/courseOwnership';
import { auditLogRepository } from '../../audit-logs';

/**
 * Participation record DTO for responses
 */
export interface ParticipationRecordDTO {
  id: string;
  date: string;
  student_id: string;
  student_name: string;
  participation_score: number;
  remarks: string | null;
}

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
 * Invalid participation score error
 * Thrown when an invalid score value is provided
 */
export class InvalidParticipationScoreError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = 'INVALID_PARTICIPATION_SCORE';

  constructor(score: number) {
    super(`Invalid participation score: ${score}. Must be between 1 and 5 (inclusive)`);
    this.name = 'InvalidParticipationScoreError';
    Object.setPrototypeOf(this, InvalidParticipationScoreError.prototype);
  }
}

/**
 * Participation record input for submission
 */
export interface ParticipationRecordInput {
  studentId: string;
  participationScore: number;
  remarks?: string;
}

/**
 * Participation submission result
 */
export interface ParticipationSubmissionResult {
  success: boolean;
  recordsSaved: number;
  message: string;
}

export class ParticipationService {
  constructor(private db: Database) {}

  /**
   * Get participation records for a course with optional date filtering
   * 
   * Retrieves participation records for a specific course.
   * Validates that the course is assigned to the requesting faculty member.
   * If date is provided, filters records for that specific date.
   * Otherwise, returns all records for the subject.
   * 
   * @param subjectId - The instruction UUID (course ID)
   * @param facultyId - The faculty UUID to validate ownership
   * @param date - Optional date filter (YYYY-MM-DD format)
   * @returns Array of participation records with student names
   * @throws CourseNotFoundError if course doesn't exist (HTTP 404)
   * @throws CourseOwnershipError if course is not assigned to faculty (HTTP 403)
   * 
   * Requirements:
   * - 10.1: Endpoint protected by faculty.participation.read permission
   * - 10.2: Validate courseId is assigned to authenticated faculty
   * - 10.3: Accept optional date query parameter
   * - 10.4: Filter by date if provided, otherwise return all records
   * - 10.5: Return records including date, student_id, student_name, participation_score, remarks
   * - 10.6: Return HTTP 403 if course not assigned to faculty
   */
  async getParticipationRecords(
    subjectId: string,
    facultyId: string,
    date?: string
  ): Promise<ParticipationRecordDTO[]> {
    // Validate course ownership
    await validateCourseOwnership(subjectId, facultyId);

    // Build query conditions
    const conditions = [
      eq(studentParticipation.instruction_id, subjectId),
      isNull(students.deleted_at)
    ];

    // Add date filter if provided
    if (date) {
      conditions.push(eq(studentParticipation.date, date));
    }

    // Query participation table with student names
    const records = await this.db
      .select({
        id: studentParticipation.id,
        date: studentParticipation.date,
        student_id: studentParticipation.student_id,
        student_first_name: students.first_name,
        student_last_name: students.last_name,
        participation_score: studentParticipation.participation_score,
        remarks: studentParticipation.remarks,
      })
      .from(studentParticipation)
      .innerJoin(students, eq(studentParticipation.student_id, students.id))
      .where(and(...conditions))
      .orderBy(studentParticipation.date, students.last_name, students.first_name);

    // Transform to ParticipationRecordDTO format
    return records.map((record) => ({
      id: record.id,
      date: record.date,
      student_id: record.student_id,
      student_name: `${record.student_first_name} ${record.student_last_name}`,
      participation_score: record.participation_score,
      remarks: record.remarks,
    }));
  }

  /**
   * Submit participation records for a course
   * 
   * Creates or updates participation records for multiple students on a specific date.
   * Validates course ownership, student enrollment, and participation score values.
   * Creates an audit log entry for the submission.
   * 
   * @param subjectId - The instruction UUID (course ID)
   * @param facultyId - The faculty UUID to validate ownership
   * @param date - The participation date (YYYY-MM-DD format)
   * @param records - Array of participation records to submit
   * @param userId - The user ID of the faculty member submitting participation
   * @returns Confirmation with number of records saved
   * @throws CourseNotFoundError if course doesn't exist (HTTP 404)
   * @throws CourseOwnershipError if course is not assigned to faculty (HTTP 403)
   * @throws InvalidStudentError if any student_id is not enrolled in the course (HTTP 400)
   * @throws InvalidParticipationScoreError if any score is invalid (HTTP 400)
   * 
   * Requirements:
   * - 10.7: Endpoint protected by faculty.participation.submit permission
   * - 10.8: Validate courseId is assigned to authenticated faculty
   * - 10.9: Require date and records array in request body
   * - 10.10: Validate each record contains studentId and participationScore
   * - 10.11: Validate participationScore is between 1 and 5
   * - 10.12: Accept optional remarks field for each record
   * - 10.13: Validate all studentIds belong to enrolled students
   * - 10.14: Return HTTP 400 if invalid studentId or participationScore
   * - 10.15: Bulk create/update participation records (upsert)
   * - 10.16: Return confirmation with number of records saved
   * - 10.17: Return HTTP 403 if course not assigned to faculty
   * - 12.1: Create audit log entry for participation submission
   */
  async submitParticipationRecords(
    subjectId: string,
    facultyId: string,
    date: string,
    records: ParticipationRecordInput[],
    userId: string
  ): Promise<ParticipationSubmissionResult> {
    // Validate course ownership
    await validateCourseOwnership(subjectId, facultyId);

    // Validate participation scores
    for (const record of records) {
      if (record.participationScore < 1 || record.participationScore > 5) {
        throw new InvalidParticipationScoreError(record.participationScore);
      }
    }

    // Extract all student IDs from records
    const studentIds = records.map(r => r.studentId);

    // Validate all student_ids belong to enrolled students in this course
    const enrolledStudents = await this.db
      .select({
        student_id: enrollments.student_id,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.instruction_id, subjectId),
          eq(enrollments.enrollment_status, 'enrolled'),
          inArray(enrollments.student_id, studentIds)
        )
      );

    const enrolledStudentIds = new Set(enrolledStudents.map(s => s.student_id));
    const invalidStudentIds = studentIds.filter(id => !enrolledStudentIds.has(id));

    if (invalidStudentIds.length > 0) {
      throw new InvalidStudentError(invalidStudentIds);
    }

    // Check for existing participation records on this date
    const existingRecords = await this.db
      .select({
        id: studentParticipation.id,
        student_id: studentParticipation.student_id,
      })
      .from(studentParticipation)
      .where(
        and(
          eq(studentParticipation.instruction_id, subjectId),
          eq(studentParticipation.date, date),
          inArray(studentParticipation.student_id, studentIds)
        )
      );

    const existingRecordMap = new Map(
      existingRecords.map(r => [r.student_id, r.id])
    );

    // Separate records into updates and inserts
    const recordsToUpdate: Array<{ id: string; participation_score: number; remarks: string | null }> = [];
    const recordsToInsert: Array<{
      instruction_id: string;
      student_id: string;
      date: string;
      participation_score: number;
      remarks: string | null;
    }> = [];

    for (const record of records) {
      const existingId = existingRecordMap.get(record.studentId);
      
      if (existingId) {
        // Update existing record
        recordsToUpdate.push({
          id: existingId,
          participation_score: record.participationScore,
          remarks: record.remarks || null,
        });
      } else {
        // Insert new record
        recordsToInsert.push({
          instruction_id: subjectId,
          student_id: record.studentId,
          date,
          participation_score: record.participationScore,
          remarks: record.remarks || null,
        });
      }
    }

    // Perform bulk operations
    let recordsSaved = 0;

    // Bulk insert new records
    if (recordsToInsert.length > 0) {
      await this.db.insert(studentParticipation).values(recordsToInsert);
      recordsSaved += recordsToInsert.length;
    }

    // Bulk update existing records
    for (const record of recordsToUpdate) {
      await this.db
        .update(studentParticipation)
        .set({
          participation_score: record.participation_score,
          remarks: record.remarks,
          updated_at: new Date(),
        })
        .where(eq(studentParticipation.id, record.id));
      recordsSaved++;
    }

    // Create audit log entry
    await auditLogRepository.create({
      user_id: userId,
      action_type: 'participation_submit',
      entity_type: 'participation',
      entity_id: subjectId,
      after_state: {
        date,
        records_count: recordsSaved,
        student_ids: studentIds,
      },
    });

    return {
      success: true,
      recordsSaved,
      message: `Successfully saved ${recordsSaved} participation record(s) for ${date}`,
    };
  }
}
