/**
 * Academic History Repository
 * Database access layer for academic history operations
 * 
 * Requirements: 8.1, 8.2, 8.3
 */

import { eq, and, inArray, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { academicHistory } from '../../../db/schema';
import { AcademicHistoryFilters } from '../types';

export interface CreateAcademicHistoryData {
  id?: string; // Optional UUID v7, generated if not provided
  student_id: string;
  subject_code: string;
  subject_name: string;
  grade: string; // Stored as decimal string in DB
  semester: string;
  academic_year: string;
  credits: number;
  remarks?: string;
}

export interface UpdateAcademicHistoryData {
  subject_code?: string;
  subject_name?: string;
  grade?: string; // Stored as decimal string in DB
  semester?: string;
  academic_year?: string;
  credits?: number;
  remarks?: string;
}

export class AcademicHistoryRepository {
  constructor(private db: Database) {}

  /**
   * Find academic history record by UUID
   * Requirement: 8.1
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(academicHistory)
      .where(eq(academicHistory.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find academic history records by student ID
   * Requirement: 8.3
   */
  async findByStudentId(studentId: string) {
    return await this.db
      .select()
      .from(academicHistory)
      .where(eq(academicHistory.student_id, studentId))
      .orderBy(academicHistory.academic_year, academicHistory.semester);
  }

  /**
   * Batch query to find academic history by multiple student IDs
   * Prevents N+1 query problem
   * Requirement: 8.3
   */
  async findByStudentIds(studentIds: string[]) {
    if (studentIds.length === 0) {
      return [];
    }

    return await this.db
      .select()
      .from(academicHistory)
      .where(inArray(academicHistory.student_id, studentIds))
      .orderBy(academicHistory.academic_year, academicHistory.semester);
  }

  /**
   * Find all academic history records with pagination and filters
   * Requirements: 8.1, 8.3
   */
  async findAll(filters?: AcademicHistoryFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Filter by student_id
    if (filters?.student_id) {
      conditions.push(eq(academicHistory.student_id, filters.student_id));
    }

    // Filter by semester
    if (filters?.semester) {
      conditions.push(eq(academicHistory.semester, filters.semester));
    }

    // Filter by academic_year
    if (filters?.academic_year) {
      conditions.push(eq(academicHistory.academic_year, filters.academic_year));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(academicHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(academicHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(academicHistory.academic_year, academicHistory.semester);

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
   * Create a new academic history record
   * Requirement: 8.1
   */
  async create(data: CreateAcademicHistoryData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(academicHistory).values(data).returning();

    return result[0];
  }

  /**
   * Update academic history record by ID
   * Requirement: 8.1
   */
  async update(id: string, data: UpdateAcademicHistoryData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(academicHistory)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(academicHistory.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Delete academic history record by ID
   * Requirement: 8.1
   */
  async delete(id: string) {
    await this.db.delete(academicHistory).where(eq(academicHistory.id, id));
  }

  /**
   * Calculate GPA for a student
   * Requirement: 8.4
   */
  async calculateGPA(studentId: string) {
    const records = await this.findByStudentId(studentId);

    if (records.length === 0) {
      return {
        gpa: 0,
        total_credits: 0,
        total_grade_points: 0,
        records_count: 0,
      };
    }

    let totalGradePoints = 0;
    let totalCredits = 0;

    for (const record of records) {
      const grade = parseFloat(record.grade);
      const credits = record.credits;

      // Only include passed courses in GPA calculation
      if (record.remarks !== 'failed' && !isNaN(grade) && credits > 0) {
        totalGradePoints += grade * credits;
        totalCredits += credits;
      }
    }

    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    return {
      gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
      total_credits: totalCredits,
      total_grade_points: Math.round(totalGradePoints * 100) / 100,
      records_count: records.length,
    };
  }
}
