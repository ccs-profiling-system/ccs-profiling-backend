/**
 * Skill Repository
 * Database access layer for skill operations
 * 
 */

import { eq, and, inArray, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { skills } from '../../../db/schema';
import { SkillFilters } from '../types';

export interface CreateSkillData {
  id?: string; // Optional UUID v7, generated if not provided
  student_id: string;
  skill_name: string;
  proficiency_level?: string;
  years_of_experience?: number;
}

export interface UpdateSkillData {
  skill_name?: string;
  proficiency_level?: string;
  years_of_experience?: number;
}

export class SkillRepository {
  constructor(private db: Database) {}

  /**
   * Find skill record by UUID
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(skills)
      .where(eq(skills.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find skill records by student ID
   */
  async findByStudentId(studentId: string) {
    return await this.db
      .select()
      .from(skills)
      .where(eq(skills.student_id, studentId))
      .orderBy(skills.skill_name);
  }

  /**
   * Batch query to find skills by multiple student IDs
   * Prevents N+1 query problem
   */
  async findByStudentIds(studentIds: string[]) {
    if (studentIds.length === 0) {
      return [];
    }

    return await this.db
      .select()
      .from(skills)
      .where(inArray(skills.student_id, studentIds))
      .orderBy(skills.skill_name);
  }

  /**
   * Find all skill records with pagination and filters
   */
  async findAll(filters?: SkillFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Filter by student_id
    if (filters?.student_id) {
      conditions.push(eq(skills.student_id, filters.student_id));
    }

    // Filter by proficiency_level
    if (filters?.proficiency_level) {
      conditions.push(eq(skills.proficiency_level, filters.proficiency_level));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(skills)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(skills.skill_name);

    return {
      data: results,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new skill record
   */
  async create(data: CreateSkillData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(skills).values(data).returning();

    return result[0];
  }

  /**
   * Update skill record by ID
   */
  async update(id: string, data: UpdateSkillData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(skills)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(skills.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Delete skill record by ID
   */
  async delete(id: string) {
    await this.db.delete(skills).where(eq(skills.id, id));
  }
}
