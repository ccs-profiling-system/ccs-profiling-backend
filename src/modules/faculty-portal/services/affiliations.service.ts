/**
 * Faculty Portal - Affiliations Service
 * Business logic layer for faculty affiliations management
 * 
 * Handles faculty affiliations viewing and updates with validation.
 * Uses the faculty_affiliations table (separate from student affiliations).
 * Implements transaction-based replace strategy for atomic updates.
 * 
 * Requirements: Phase 10 - Affiliations Management
 */

import { eq, and, isNull, desc } from 'drizzle-orm';
import { Database } from '../../../db';
import { facultyAffiliations, faculty } from '../../../db/schema';
import { NotFoundError } from '../../../shared/errors';
import { auditLogRepository } from '../../audit-logs';
import { Affiliation } from '../schemas/affiliations.schema';

/**
 * Affiliation DTO for API responses
 * Maps DB fields to API fields:
 * - start_date -> joinDate
 * - end_date -> endDate
 * - organization_name -> organizationName
 * - is_active -> isActive
 */
export interface AffiliationDTO {
  id: string;
  organizationName: string;
  type: string;
  role: string | null;
  joinDate: string;
  endDate: string | null;
  isActive: boolean;
}

/**
 * Affiliations update result
 */
export interface AffiliationsUpdateResult {
  success: boolean;
  affiliations: AffiliationDTO[];
  message: string;
}

export class AffiliationsService {
  constructor(private db: Database) {}

  /**
   * Get affiliations by faculty ID
   * 
   * Retrieves all affiliations for a specific faculty member from the faculty_affiliations table.
   * Returns empty array if no affiliations found.
   * Maps DB fields to API fields (start_date -> joinDate, etc.)
   * 
   * @param facultyId - The faculty UUID
   * @returns Array of affiliations ordered by start_date descending
   * @throws NotFoundError if faculty doesn't exist
   */
  async getAffiliationsByFaculty(facultyId: string): Promise<AffiliationDTO[]> {
    // Verify faculty exists
    const facultyRecord = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    if (!facultyRecord[0]) {
      throw new NotFoundError('Faculty not found');
    }

    // Query faculty_affiliations table
    const affiliations = await this.db
      .select({
        id: facultyAffiliations.id,
        organizationName: facultyAffiliations.organization_name,
        type: facultyAffiliations.type,
        role: facultyAffiliations.role,
        startDate: facultyAffiliations.start_date,
        endDate: facultyAffiliations.end_date,
        isActive: facultyAffiliations.is_active,
      })
      .from(facultyAffiliations)
      .where(eq(facultyAffiliations.faculty_id, facultyId))
      .orderBy(desc(facultyAffiliations.start_date));

    // Transform to DTO format (map DB fields to API fields)
    return affiliations.map((affiliation) => ({
      id: affiliation.id,
      organizationName: affiliation.organizationName,
      type: affiliation.type,
      role: affiliation.role,
      joinDate: affiliation.startDate,
      endDate: affiliation.endDate,
      isActive: affiliation.isActive,
    }));
  }

  /**
   * Update affiliations for a faculty member
   * 
   * Replaces all existing affiliations with the provided affiliations array.
   * Uses transaction to ensure atomic operation (delete all + bulk insert).
   * Validates type values and date constraints.
   * Maps API fields to DB fields (joinDate -> start_date, etc.)
   * Creates audit log entry for the update.
   * 
   * @param facultyId - The faculty UUID
   * @param affiliations - Array of affiliations to set (validated by Zod schema)
   * @param userId - The user ID performing the update
   * @returns Updated affiliations list ordered by start_date descending
   * @throws NotFoundError if faculty doesn't exist
   * 
   * Requirements:
   * - Uses faculty_affiliations table (separate from student affiliations)
   * - Replace strategy WITH transaction (atomic operation)
   * - Map API joinDate -> DB start_date
   * - Map API endDate -> DB end_date
   * - Map API organizationName -> DB organization_name
   * - Map API isActive -> DB is_active
   * - Validate type: professional, academic, community, other
   * - Validate start_date (joinDate) is not in the future
   * - Validate end_date is after start_date if provided
   * - Return updated affiliations list ordered by start_date descending
   * - Return empty array if no affiliations provided
   * - Integrate audit logging
   */
  async updateAffiliations(
    facultyId: string,
    affiliations: Affiliation[],
    userId: string
  ): Promise<AffiliationsUpdateResult> {
    // Verify faculty exists
    const facultyRecord = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    if (!facultyRecord[0]) {
      throw new NotFoundError('Faculty not found');
    }

    // Validate type values
    const validTypes = ['professional', 'academic', 'community', 'other'];

    for (const affiliation of affiliations) {
      if (!validTypes.includes(affiliation.type)) {
        throw new Error(`Invalid type: ${affiliation.type}. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate start_date (joinDate) is not in the future
      const joinDate = new Date(affiliation.joinDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (joinDate > today) {
        throw new Error(`Join date cannot be in the future: ${affiliation.joinDate}`);
      }

      // Validate end_date is after start_date if provided
      if (affiliation.endDate) {
        const endDate = new Date(affiliation.endDate);
        if (endDate <= joinDate) {
          throw new Error(`End date must be after join date for ${affiliation.organizationName}`);
        }
      }
    }

    // Use transaction for atomic replace operation
    await this.db.transaction(async (tx) => {
      // Delete all existing affiliations for this faculty
      await tx
        .delete(facultyAffiliations)
        .where(eq(facultyAffiliations.faculty_id, facultyId));

      // Bulk insert new affiliations if any provided
      if (affiliations.length > 0) {
        const affiliationsToInsert = affiliations.map((affiliation) => ({
          faculty_id: facultyId,
          organization_name: affiliation.organizationName,
          type: affiliation.type,
          role: affiliation.role,
          start_date: affiliation.joinDate,
          end_date: affiliation.endDate || null,
          is_active: affiliation.isActive ?? true,
        }));

        await tx.insert(facultyAffiliations).values(affiliationsToInsert);
      }
    });

    // Create audit log entry
    await auditLogRepository.create({
      user_id: userId,
      action_type: 'affiliations_update',
      entity_type: 'faculty_affiliations',
      entity_id: facultyId,
      after_state: {
        affiliations_count: affiliations.length,
        affiliations: affiliations.map((a) => ({
          organizationName: a.organizationName,
          type: a.type,
          role: a.role,
          joinDate: a.joinDate,
        })),
      },
    });

    // Retrieve and return updated affiliations
    const updatedAffiliations = await this.getAffiliationsByFaculty(facultyId);

    return {
      success: true,
      affiliations: updatedAffiliations,
      message: `Successfully updated ${updatedAffiliations.length} affiliation(s)`,
    };
  }
}
