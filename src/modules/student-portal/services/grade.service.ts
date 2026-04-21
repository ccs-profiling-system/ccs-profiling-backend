/**
 * Student Portal - Grade Service
 * Business logic layer for grade management
 * 
 * Handles grade retrieval, GPA calculation, and grade history.
 * Ensures students can only access their own grades.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { eq, and, desc } from 'drizzle-orm';
import { Database } from '../../../db';
import { academicHistory } from '../../../db/schema';
import { NotFoundError } from '../../../shared/errors';
import { StudentAccessError } from '../utils/studentScope';
import { GradeDTO, GPADTO, GradeHistoryDTO } from '../types';

export class GradeService {
  constructor(private db: Database) {}

  /**
   * Get current semester grades
   * 
   * Retrieves grades for all enrolled courses in the current semester.
   * Filters academic_history by current academic year and semester.
   * Calculates semester GPA as weighted average.
   * Orders by course code ascending.
   * 
   * @param studentId - The student UUID (internal ID)
   * @returns Object with grades array and semester GPA
   * 
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
   */
  async getCurrentSemesterGrades(
    studentId: string
  ): Promise<{ grades: GradeDTO[]; semester_gpa: number | null }> {
    // Get current academic period
    const { currentSemester, currentAcademicYear } = this.getCurrentAcademicPeriod();

    // Query grades for current semester
    const result = await this.db
      .select({
        id: academicHistory.id,
        subject_code: academicHistory.subject_code,
        subject_name: academicHistory.subject_name,
        grade: academicHistory.grade,
        credits: academicHistory.credits,
        remarks: academicHistory.remarks,
        semester: academicHistory.semester,
        academic_year: academicHistory.academic_year,
      })
      .from(academicHistory)
      .where(
        and(
          eq(academicHistory.student_id, studentId),
          eq(academicHistory.semester, currentSemester),
          eq(academicHistory.academic_year, currentAcademicYear)
        )
      )
      .orderBy(academicHistory.subject_code);

    // Convert to DTOs
    const grades: GradeDTO[] = result.map((row) => ({
      id: row.id,
      course_code: row.subject_code,
      course_name: row.subject_name,
      grade_value: row.grade,
      grade_points: parseFloat(row.grade),
      units: row.credits,
      remarks: row.remarks,
      semester: row.semester,
      academic_year: row.academic_year,
    }));

    // Calculate semester GPA
    const semesterGPA = this.calculateSemesterGPA(grades);

    return {
      grades,
      semester_gpa: semesterGPA,
    };
  }

  /**
   * Get grade by ID
   * 
   * Retrieves specific grade details including course details, grade value, grade points, units.
   * Validates grade belongs to student (returns 403 if not).
   * Returns 404 if grade not found.
   * 
   * @param studentId - The student UUID (internal ID)
   * @param gradeId - The grade record UUID
   * @returns Grade details DTO
   * @throws NotFoundError if grade not found
   * @throws StudentAccessError if grade belongs to another student
   * 
   * Requirements: 10.1, 10.2, 10.3
   */
  async getGradeById(studentId: string, gradeId: string): Promise<GradeDTO> {
    // Query grade by ID
    const result = await this.db
      .select({
        id: academicHistory.id,
        student_id: academicHistory.student_id,
        subject_code: academicHistory.subject_code,
        subject_name: academicHistory.subject_name,
        grade: academicHistory.grade,
        credits: academicHistory.credits,
        remarks: academicHistory.remarks,
        semester: academicHistory.semester,
        academic_year: academicHistory.academic_year,
      })
      .from(academicHistory)
      .where(eq(academicHistory.id, gradeId))
      .limit(1);

    const gradeRecord = result[0];

    // Check if grade exists
    if (!gradeRecord) {
      throw new NotFoundError('Grade not found');
    }

    // Validate grade belongs to student
    if (gradeRecord.student_id !== studentId) {
      throw new StudentAccessError('Access denied: You can only access your own grades');
    }

    // Convert to DTO
    return {
      id: gradeRecord.id,
      course_code: gradeRecord.subject_code,
      course_name: gradeRecord.subject_name,
      grade_value: gradeRecord.grade,
      grade_points: parseFloat(gradeRecord.grade),
      units: gradeRecord.credits,
      remarks: gradeRecord.remarks,
      semester: gradeRecord.semester,
      academic_year: gradeRecord.academic_year,
    };
  }

  /**
   * Get grade history
   * 
   * Retrieves all grades from all completed semesters.
   * Groups by academic year and semester.
   * Calculates GPA for each semester.
   * Orders semesters by academic year and semester descending.
   * 
   * @param studentId - The student UUID (internal ID)
   * @returns Grade history grouped by semester
   * 
   * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
   */
  async getGradeHistory(studentId: string): Promise<GradeHistoryDTO> {
    // Query all grades for student
    const result = await this.db
      .select({
        id: academicHistory.id,
        subject_code: academicHistory.subject_code,
        subject_name: academicHistory.subject_name,
        grade: academicHistory.grade,
        credits: academicHistory.credits,
        remarks: academicHistory.remarks,
        semester: academicHistory.semester,
        academic_year: academicHistory.academic_year,
      })
      .from(academicHistory)
      .where(eq(academicHistory.student_id, studentId))
      .orderBy(desc(academicHistory.academic_year), desc(academicHistory.semester));

    // Group grades by semester
    const semesterMap = new Map<
      string,
      {
        academic_year: string;
        semester: string;
        grades: GradeDTO[];
      }
    >();

    for (const row of result) {
      const key = `${row.academic_year}-${row.semester}`;

      if (!semesterMap.has(key)) {
        semesterMap.set(key, {
          academic_year: row.academic_year,
          semester: row.semester,
          grades: [],
        });
      }

      const gradeDTO: GradeDTO = {
        id: row.id,
        course_code: row.subject_code,
        course_name: row.subject_name,
        grade_value: row.grade,
        grade_points: parseFloat(row.grade),
        units: row.credits,
        remarks: row.remarks,
        semester: row.semester,
        academic_year: row.academic_year,
      };

      semesterMap.get(key)!.grades.push(gradeDTO);
    }

    // Calculate GPA for each semester and build response
    const semesters = Array.from(semesterMap.values()).map((semesterData) => ({
      academic_year: semesterData.academic_year,
      semester: semesterData.semester,
      semester_gpa: this.calculateSemesterGPA(semesterData.grades),
      grades: semesterData.grades,
    }));

    return { semesters };
  }

  /**
   * Calculate GPA
   * 
   * Calculates cumulative GPA as weighted average of all completed courses.
   * Calculates current semester GPA from current semester courses only.
   * Counts units attempted (all enrolled course units).
   * Counts units earned (units from passed courses only).
   * Handles edge cases (no grades, division by zero).
   * 
   * @param studentId - The student UUID (internal ID)
   * @returns GPA calculation DTO
   * 
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
   */
  async calculateGPA(studentId: string): Promise<GPADTO> {
    // Get all grades for student
    const allGrades = await this.db
      .select({
        grade: academicHistory.grade,
        credits: academicHistory.credits,
        remarks: academicHistory.remarks,
        semester: academicHistory.semester,
        academic_year: academicHistory.academic_year,
      })
      .from(academicHistory)
      .where(eq(academicHistory.student_id, studentId));

    // Get current academic period
    const { currentSemester, currentAcademicYear } = this.getCurrentAcademicPeriod();

    // Separate current semester grades from all grades
    const currentSemesterGrades = allGrades.filter(
      (g) => g.semester === currentSemester && g.academic_year === currentAcademicYear
    );

    // Calculate cumulative GPA
    let totalGradePoints = 0;
    let totalUnitsAttempted = 0;
    let totalUnitsEarned = 0;

    for (const grade of allGrades) {
      const gradePoints = parseFloat(grade.grade);
      const units = grade.credits;

      // Add to total grade points and units attempted
      totalGradePoints += gradePoints * units;
      totalUnitsAttempted += units;

      // Count units earned (passed courses only)
      // Assuming passed courses have remarks 'passed' or grade >= 3.0 (passing grade)
      const isPassed =
        grade.remarks === 'passed' ||
        (grade.remarks !== 'failed' && gradePoints >= 3.0);

      if (isPassed) {
        totalUnitsEarned += units;
      }
    }

    // Calculate cumulative GPA (handle division by zero)
    const cumulativeGPA =
      totalUnitsAttempted > 0 ? totalGradePoints / totalUnitsAttempted : 0;

    // Calculate current semester GPA
    let currentSemesterGPA: number | null = null;
    if (currentSemesterGrades.length > 0) {
      let semesterGradePoints = 0;
      let semesterUnits = 0;

      for (const grade of currentSemesterGrades) {
        const gradePoints = parseFloat(grade.grade);
        const units = grade.credits;
        semesterGradePoints += gradePoints * units;
        semesterUnits += units;
      }

      currentSemesterGPA = semesterUnits > 0 ? semesterGradePoints / semesterUnits : 0;
    }

    return {
      cumulative_gpa: parseFloat(cumulativeGPA.toFixed(2)),
      current_semester_gpa: currentSemesterGPA !== null ? parseFloat(currentSemesterGPA.toFixed(2)) : null,
      total_units_attempted: totalUnitsAttempted,
      total_units_earned: totalUnitsEarned,
    };
  }

  /**
   * Calculate semester GPA from grades
   * 
   * Helper method to calculate GPA for a specific set of grades.
   * Uses weighted average: SUM(grade_points * units) / SUM(units)
   * 
   * @param grades - Array of grade DTOs
   * @returns Calculated GPA or null if no grades
   */
  private calculateSemesterGPA(grades: GradeDTO[]): number {
    if (grades.length === 0) {
      return 0;
    }

    let totalGradePoints = 0;
    let totalUnits = 0;

    for (const grade of grades) {
      totalGradePoints += grade.grade_points * grade.units;
      totalUnits += grade.units;
    }

    // Handle division by zero
    if (totalUnits === 0) {
      return 0;
    }

    return parseFloat((totalGradePoints / totalUnits).toFixed(2));
  }

  /**
   * Get current academic period
   * 
   * Determines the current semester and academic year based on the current date.
   * 
   * @returns Object with currentSemester and currentAcademicYear
   */
  private getCurrentAcademicPeriod(): {
    currentSemester: string;
    currentAcademicYear: string;
  } {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-indexed

    let currentSemester: string;
    let currentAcademicYear: string;

    if (currentMonth >= 8 && currentMonth <= 12) {
      // First semester: August to December
      currentSemester = '1st';
      currentAcademicYear = `${currentYear}-${currentYear + 1}`;
    } else if (currentMonth >= 1 && currentMonth <= 5) {
      // Second semester: January to May
      currentSemester = '2nd';
      currentAcademicYear = `${currentYear - 1}-${currentYear}`;
    } else {
      // Summer: June to July
      currentSemester = 'summer';
      currentAcademicYear = `${currentYear - 1}-${currentYear}`;
    }

    return { currentSemester, currentAcademicYear };
  }
}
