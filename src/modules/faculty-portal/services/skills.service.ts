/**
 * Faculty Portal - Skills Service
 * Business logic layer for faculty skills management
 * 
 * Handles faculty skills viewing and updates with validation.
 * Uses the faculty_skills table (separate from student skills).
 * Implements transaction-based replace strategy for atomic updates.
 * 
 * Requirements: Phase 10 - Skills Management
 */

import { eq, and, isNull } from 'drizzle-orm';
import { Database } from '../../../db';
import { facultySkills, faculty } from '../../../db/schema';
import { NotFoundError } from '../../../shared/errors';
import { auditLogRepository } from '../../audit-logs';
import { Skill } from '../schemas/skills.schema';

/**
 * Skill DTO for API responses
 */
export interface SkillDTO {
  id: string;
  skillName: string;
  category: string;
  proficiencyLevel: string | null;
  yearsOfExperience: number | null;
}

/**
 * Skills update result
 */
export interface SkillsUpdateResult {
  success: boolean;
  skills: SkillDTO[];
  message: string;
}

export class SkillsService {
  constructor(private db: Database) {}

  /**
   * Get skills by faculty ID
   * 
   * Retrieves all skills for a specific faculty member from the faculty_skills table.
   * Returns empty array if no skills found.
   * 
   * @param facultyId - The faculty UUID
   * @returns Array of skills ordered by category, then skillName
   * @throws NotFoundError if faculty doesn't exist
   */
  async getSkillsByFaculty(facultyId: string): Promise<SkillDTO[]> {
    // Verify faculty exists
    const facultyRecord = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    if (!facultyRecord[0]) {
      throw new NotFoundError('Faculty not found');
    }

    // Query faculty_skills table
    const skills = await this.db
      .select({
        id: facultySkills.id,
        skillName: facultySkills.skill_name,
        category: facultySkills.category,
        proficiencyLevel: facultySkills.proficiency_level,
        yearsOfExperience: facultySkills.years_of_experience,
      })
      .from(facultySkills)
      .where(eq(facultySkills.faculty_id, facultyId))
      .orderBy(facultySkills.category, facultySkills.skill_name);

    // Transform to DTO format
    return skills.map((skill) => ({
      id: skill.id,
      skillName: skill.skillName,
      category: skill.category,
      proficiencyLevel: skill.proficiencyLevel,
      yearsOfExperience: skill.yearsOfExperience,
    }));
  }

  /**
   * Update skills for a faculty member
   * 
   * Replaces all existing skills with the provided skills array.
   * Uses transaction to ensure atomic operation (delete all + bulk insert).
   * Validates category and proficiencyLevel values.
   * Creates audit log entry for the update.
   * 
   * @param facultyId - The faculty UUID
   * @param skills - Array of skills to set (validated by Zod schema)
   * @param userId - The user ID performing the update
   * @returns Updated skills list ordered by category, skillName
   * @throws NotFoundError if faculty doesn't exist
   * 
   * Requirements:
   * - Uses faculty_skills table (separate from student skills)
   * - Replace strategy WITH transaction (atomic operation)
   * - Validate category: technical, soft, language, sports, other
   * - Validate proficiencyLevel: beginner, intermediate, advanced, expert
   * - Return updated skills list ordered by category, skillName
   * - Return empty array if no skills provided
   * - Integrate audit logging
   */
  async updateSkills(
    facultyId: string,
    skills: Skill[],
    userId: string
  ): Promise<SkillsUpdateResult> {
    // Verify faculty exists
    const facultyRecord = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    if (!facultyRecord[0]) {
      throw new NotFoundError('Faculty not found');
    }

    // Validate category and proficiencyLevel values
    const validCategories = ['technical', 'soft', 'language', 'sports', 'other'];
    const validProficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

    for (const skill of skills) {
      if (!validCategories.includes(skill.category)) {
        throw new Error(`Invalid category: ${skill.category}. Must be one of: ${validCategories.join(', ')}`);
      }
      if (skill.proficiencyLevel && !validProficiencyLevels.includes(skill.proficiencyLevel)) {
        throw new Error(`Invalid proficiencyLevel: ${skill.proficiencyLevel}. Must be one of: ${validProficiencyLevels.join(', ')}`);
      }
    }

    // Use transaction for atomic replace operation
    await this.db.transaction(async (tx) => {
      // Delete all existing skills for this faculty
      await tx
        .delete(facultySkills)
        .where(eq(facultySkills.faculty_id, facultyId));

      // Bulk insert new skills if any provided
      if (skills.length > 0) {
        const skillsToInsert = skills.map((skill) => ({
          faculty_id: facultyId,
          skill_name: skill.skillName,
          category: skill.category,
          proficiency_level: skill.proficiencyLevel || null,
          years_of_experience: skill.yearsOfExperience || null,
        }));

        await tx.insert(facultySkills).values(skillsToInsert);
      }
    });

    // Create audit log entry
    await auditLogRepository.create({
      user_id: userId,
      action_type: 'skills_update',
      entity_type: 'faculty_skills',
      entity_id: facultyId,
      after_state: {
        skills_count: skills.length,
        skills: skills.map((s) => ({
          skillName: s.skillName,
          category: s.category,
          proficiencyLevel: s.proficiencyLevel,
        })),
      },
    });

    // Retrieve and return updated skills
    const updatedSkills = await this.getSkillsByFaculty(facultyId);

    return {
      success: true,
      skills: updatedSkills,
      message: `Successfully updated ${updatedSkills.length} skill(s)`,
    };
  }
}
