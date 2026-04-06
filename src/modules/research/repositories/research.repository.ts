/**
 * Research Repository
 * Database access layer for research operations
 * 
 * Requirements: 12.1, 12.6, 12.7, 28.4
 */

import { eq, and, isNull, ilike, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { research, researchAuthors, researchAdvisers } from '../../../db/schema/research';
import { students } from '../../../db/schema/students';
import { faculty } from '../../../db/schema/faculty';
import { ResearchFilters } from '../types';

export interface CreateResearchData {
  id: string;
  title: string;
  abstract?: string;
  research_type: string;
  status?: string;
  start_date?: string;
  completion_date?: string;
  publication_url?: string;
}

export interface UpdateResearchData {
  title?: string;
  abstract?: string;
  research_type?: string;
  status?: string;
  start_date?: string;
  completion_date?: string;
  publication_url?: string;
}

export interface CreateAuthorData {
  id: string;
  research_id: string;
  student_id: string;
  author_order: number;
}

export interface CreateAdviserData {
  id: string;
  research_id: string;
  faculty_id: string;
  adviser_role?: string;
}

export class ResearchRepository {
  constructor(private db: Database) {}

  /**
   * Find research by UUID (excludes soft-deleted)
   * Requirement: 12.1
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(research)
      .where(and(eq(research.id, id), isNull(research.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find research by student ID (as author)
   * Requirements: 12.6, 28.4
   */
  async findByStudentId(studentId: string) {
    const result = await this.db
      .select({
        research: research,
      })
      .from(research)
      .innerJoin(researchAuthors, eq(research.id, researchAuthors.research_id))
      .where(
        and(
          eq(researchAuthors.student_id, studentId),
          isNull(research.deleted_at)
        )
      );

    return result.map((r) => r.research);
  }

  /**
   * Find research by faculty ID (as adviser)
   * Requirements: 12.7, 28.4
   */
  async findByFacultyId(facultyId: string) {
    const result = await this.db
      .select({
        research: research,
      })
      .from(research)
      .innerJoin(researchAdvisers, eq(research.id, researchAdvisers.research_id))
      .where(
        and(
          eq(researchAdvisers.faculty_id, facultyId),
          isNull(research.deleted_at)
        )
      );

    return result.map((r) => r.research);
  }

  /**
   * Find all research with pagination and filters (excludes soft-deleted)
   * Requirements: 12.1, 28.4
   */
  async findAll(filters?: ResearchFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [isNull(research.deleted_at)];

    // Search by title
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(ilike(research.title, searchTerm));
    }

    // Filter by research type
    if (filters?.research_type) {
      conditions.push(eq(research.research_type, filters.research_type));
    }

    // Filter by status
    if (filters?.status) {
      conditions.push(eq(research.status, filters.status));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(research)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(research)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(research.created_at);

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
   * Create a new research
   * Requirement: 12.1
   */
  async create(data: CreateResearchData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(research).values(data).returning();

    return result[0];
  }

  /**
   * Update research by ID
   * Requirement: 12.1
   */
  async update(id: string, data: UpdateResearchData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(research)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(research.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Soft delete research by ID
   * Requirements: 12.1, 28.4
   */
  async softDelete(id: string) {
    await this.db
      .update(research)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(research.id, id));
  }

  /**
   * Get all authors for a research
   * Requirement: 12.6
   */
  async getAuthors(researchId: string) {
    const result = await this.db
      .select({
        author: researchAuthors,
        student: students,
      })
      .from(researchAuthors)
      .innerJoin(students, eq(researchAuthors.student_id, students.id))
      .where(eq(researchAuthors.research_id, researchId))
      .orderBy(researchAuthors.author_order);

    return result;
  }

  /**
   * Get all advisers for a research
   * Requirement: 12.7
   */
  async getAdvisers(researchId: string) {
    const result = await this.db
      .select({
        adviser: researchAdvisers,
        faculty: faculty,
      })
      .from(researchAdvisers)
      .innerJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(eq(researchAdvisers.research_id, researchId));

    return result;
  }

  /**
   * Add author to research
   * Requirement: 12.6
   */
  async addAuthor(data: CreateAuthorData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .insert(researchAuthors)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Remove author from research
   * Requirement: 12.6
   */
  async removeAuthor(researchId: string, studentId: string, tx?: Database) {
    const dbInstance = tx || this.db;
    await dbInstance
      .delete(researchAuthors)
      .where(
        and(
          eq(researchAuthors.research_id, researchId),
          eq(researchAuthors.student_id, studentId)
        )
      );
  }

  /**
   * Add adviser to research
   * Requirement: 12.7
   */
  async addAdviser(data: CreateAdviserData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .insert(researchAdvisers)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Remove adviser from research
   * Requirement: 12.7
   */
  async removeAdviser(researchId: string, facultyId: string, tx?: Database) {
    const dbInstance = tx || this.db;
    await dbInstance
      .delete(researchAdvisers)
      .where(
        and(
          eq(researchAdvisers.research_id, researchId),
          eq(researchAdvisers.faculty_id, facultyId)
        )
      );
  }

  /**
   * Check if author already exists for research
   * Prevents duplicate author entries
   * Requirement: 12.6
   */
  async findExistingAuthor(researchId: string, studentId: string) {
    const result = await this.db
      .select()
      .from(researchAuthors)
      .where(
        and(
          eq(researchAuthors.research_id, researchId),
          eq(researchAuthors.student_id, studentId)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  /**
   * Check if adviser already exists for research
   * Prevents duplicate adviser entries
   * Requirement: 12.7
   */
  async findExistingAdviser(researchId: string, facultyId: string) {
    const result = await this.db
      .select()
      .from(researchAdvisers)
      .where(
        and(
          eq(researchAdvisers.research_id, researchId),
          eq(researchAdvisers.faculty_id, facultyId)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find student by ID
   * Used for validation before adding as author
   * Requirement: 12.6
   */
  async findStudentById(studentId: string) {
    const result = await this.db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), isNull(students.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find faculty by ID
   * Used for validation before adding as adviser
   * Requirement: 12.7
   */
  async findFacultyById(facultyId: string) {
    const result = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get authors and advisers for multiple research records (batch query)
   * Prevents N+1 query problem
   * Requirements: 12.6, 12.7
   */
  async getAuthorsAndAdvisersForMultiple(researchIds: string[]) {
    if (researchIds.length === 0) {
      return { authors: [], advisers: [] };
    }

    // Batch fetch all authors using inArray
    const authorsResult = await this.db
      .select({
        author: researchAuthors,
        student: students,
      })
      .from(researchAuthors)
      .innerJoin(students, eq(researchAuthors.student_id, students.id))
      .where(sql`${researchAuthors.research_id} IN (${sql.join(researchIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(researchAuthors.author_order);

    // Batch fetch all advisers using inArray
    const advisersResult = await this.db
      .select({
        adviser: researchAdvisers,
        faculty: faculty,
      })
      .from(researchAdvisers)
      .innerJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(sql`${researchAdvisers.research_id} IN (${sql.join(researchIds.map(id => sql`${id}`), sql`, `)})`);

    return {
      authors: authorsResult,
      advisers: advisersResult,
    };
  }
}
