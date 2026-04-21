/**
 * Student Portal - Profile Service
 * Business logic layer for student profile management
 * 
 * Handles student profile viewing and updates with validation.
 * Ensures students can only access their own profiles.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { eq, and, isNull } from 'drizzle-orm';
import { Database } from '../../../db';
import { students } from '../../../db/schema';
import { NotFoundError } from '../../../shared/errors';
import { StudentProfileDTO } from '../types';
import { UpdateProfileInput } from '../schemas/profile.schema';

export class ProfileService {
  constructor(private db: Database) {}

  /**
   * Get student profile by student UUID (internal ID)
   * 
   * @param studentId - The student UUID (internal ID) to retrieve
   * @returns Student profile data
   * @throws NotFoundError if student not found
   * 
   * Requirements: 1.1
   */
  async getProfileById(studentId: string): Promise<StudentProfileDTO> {
    const result = await this.db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), isNull(students.deleted_at)))
      .limit(1);

    const studentRecord = result[0];

    if (!studentRecord) {
      throw new NotFoundError('Student profile not found');
    }

    return this.toProfileDTO(studentRecord);
  }

  /**
   * Update student profile
   * 
   * Updates email and phone fields with validation.
   * Email format and phone format are validated by Zod schema.
   * 
   * @param studentId - The student UUID (internal ID) to update
   * @param data - Profile update data (validated by Zod schema)
   * @returns Updated student profile data
   * @throws NotFoundError if student not found
   * 
   * Requirements: 1.2, 1.3, 1.4
   */
  async updateProfile(
    studentId: string,
    data: UpdateProfileInput
  ): Promise<StudentProfileDTO> {
    // Check if student exists
    const existing = await this.db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), isNull(students.deleted_at)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundError('Student profile not found');
    }

    // Update student profile
    const result = await this.db
      .update(students)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(students.id, studentId))
      .returning();

    const updated = result[0];

    if (!updated) {
      throw new NotFoundError('Student profile not found');
    }

    return this.toProfileDTO(updated);
  }

  /**
   * Transform database entity to StudentProfileDTO
   * 
   * @param studentRecord - Raw student record from database
   * @returns Formatted StudentProfileDTO
   */
  private toProfileDTO(studentRecord: any): StudentProfileDTO {
    return {
      id: studentRecord.id,
      student_id: studentRecord.student_id,
      student_number: studentRecord.student_id, // student_id serves as student_number
      first_name: studentRecord.first_name,
      last_name: studentRecord.last_name,
      middle_name: studentRecord.middle_name || null,
      email: studentRecord.email,
      phone: studentRecord.phone || null,
      program: studentRecord.program || 'Not specified',
      year_level: studentRecord.year_level || 1,
      enrollment_status: studentRecord.status || 'active',
      created_at: studentRecord.created_at.toISOString(),
      updated_at: studentRecord.updated_at.toISOString(),
    };
  }
}
