/**
 * Faculty Portal - Profile Service
 * Business logic layer for faculty profile management
 * 
 * Handles faculty profile viewing and updates with validation
 */

import { eq, and, isNull } from 'drizzle-orm';
import { Database } from '../../../db';
import { faculty } from '../../../db/schema';
import { NotFoundError } from '../../../shared/errors';
import { FacultyProfileDTO } from '../types';
import { UpdateProfileInput } from '../schemas/profile.schema';

export class ProfileService {
  constructor(private db: Database) {}

  /**
   * Get faculty profile by faculty_id
   * 
   * @param facultyId - The faculty_id to retrieve
   * @returns Faculty profile data
   * @throws NotFoundError if faculty not found
   */
  async getProfileById(facultyId: string): Promise<FacultyProfileDTO> {
    const result = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.faculty_id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    const facultyRecord = result[0];

    if (!facultyRecord) {
      throw new NotFoundError('Faculty profile not found');
    }

    return this.toProfileDTO(facultyRecord);
  }

  /**
   * Update faculty profile
   * 
   * @param facultyId - The faculty_id to update
   * @param data - Profile update data (validated by Zod schema)
   * @returns Updated faculty profile data
   * @throws NotFoundError if faculty not found
   */
  async updateProfile(
    facultyId: string,
    data: UpdateProfileInput
  ): Promise<FacultyProfileDTO> {
    // Check if faculty exists
    const existing = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.faculty_id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundError('Faculty profile not found');
    }

    // Update faculty profile
    const result = await this.db
      .update(faculty)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(faculty.faculty_id, facultyId))
      .returning();

    const updated = result[0];

    if (!updated) {
      throw new NotFoundError('Faculty profile not found');
    }

    return this.toProfileDTO(updated);
  }

  /**
   * Transform database entity to FacultyProfileDTO
   * 
   * @param facultyRecord - Raw faculty record from database
   * @returns Formatted FacultyProfileDTO
   */
  private toProfileDTO(facultyRecord: any): FacultyProfileDTO {
    return {
      id: facultyRecord.id,
      faculty_id: facultyRecord.faculty_id,
      user_id: facultyRecord.user_id || null,
      first_name: facultyRecord.first_name,
      last_name: facultyRecord.last_name,
      middle_name: facultyRecord.middle_name || null,
      email: facultyRecord.email,
      phone: facultyRecord.phone || null,
      department: facultyRecord.department,
      position: facultyRecord.position || null,
      specialization: facultyRecord.specialization || null,
      office_location: facultyRecord.office_location || null,
      consultation_hours: facultyRecord.consultation_hours || null,
      bio: facultyRecord.bio || null,
      status: facultyRecord.status,
      created_at: facultyRecord.created_at.toISOString(),
      updated_at: facultyRecord.updated_at.toISOString(),
    };
  }
}
