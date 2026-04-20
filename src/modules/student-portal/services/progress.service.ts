/**
 * Student Portal - Progress Service
 * Business logic layer for academic progress tracking
 * 
 * Calculates student academic progress including credits earned, academic standing,
 * and completed courses grouped by semester.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { eq, and, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { academicHistory, students } from '../../../db/schema';
import { AcademicProgressDTO, AcademicStanding } from '../types';

export class ProgressService {
  constructor(private db: Database) {}

  /**
   * Get academic progress for a student
   * 
   * Calculates comprehensive academic progress metrics:
   * - Total credits earned (sum of passed courses)
   * - Total credits required for degree
   * - Current year level
   * - Academic standing (Good Standing: GPA >= 2.0, Probation: GPA < 2.0)
   * - Completed courses grouped by academic year and semester
   * 
   * @param studentId - The student UUID (internal ID)
   * @returns Academic progress summary with metrics and course history
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async getAcademicProgress(studentId: string): Promise<AcademicProgressDTO> {
    // Get student information for year level and degree requirements
    const studentInfo = await this.db
      .select({
        year_level: students.year_level,
        program: students.program,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (studentInfo.length === 0) {
      throw new Error('Student not found');
    }

    const { year_level } = studentInfo[0];

    // Calculate total credits earned from passed courses
    // Assuming 'passed' remarks or grade >= 1.0 indicates passing
    const creditsResult = await this.db
      .select({
        total_credits_earned: sql<number>`COALESCE(SUM(${academicHistory.credits}), 0)`,
      })
      .from(academicHistory)
      .where(
        and(
          eq(academicHistory.student_id, studentId),
          // Consider courses with grade >= 1.0 as passed
          sql`CAST(${academicHistory.grade} AS DECIMAL) >= 1.0`
        )
      );

    const totalCreditsEarned = Number(creditsResult[0].total_credits_earned);

    // Calculate GPA for academic standing determination
    const gpaResult = await this.db
      .select({
        totalGradePoints: sql<number>`COALESCE(SUM(CAST(${academicHistory.grade} AS DECIMAL) * ${academicHistory.credits}), 0)`,
        totalCredits: sql<number>`COALESCE(SUM(${academicHistory.credits}), 0)`,
      })
      .from(academicHistory)
      .where(eq(academicHistory.student_id, studentId));

    const { totalGradePoints, totalCredits } = gpaResult[0];
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    // Determine academic standing based on GPA
    // Good Standing: GPA >= 2.0, Probation: GPA < 2.0
    const academicStanding: AcademicStanding = gpa >= 2.0 ? 'Good Standing' : 'Probation';

    // Get completed courses grouped by academic year and semester
    const completedCourses = await this.db
      .select({
        academic_year: academicHistory.academic_year,
        semester: academicHistory.semester,
        course_code: academicHistory.subject_code,
        course_name: academicHistory.subject_name,
        units: academicHistory.credits,
        grade: academicHistory.grade,
      })
      .from(academicHistory)
      .where(eq(academicHistory.student_id, studentId))
      .orderBy(academicHistory.academic_year, academicHistory.semester, academicHistory.subject_code);

    // Group courses by academic year and semester
    const coursesBySemester = completedCourses.reduce((acc, course) => {
      const key = `${course.academic_year}-${course.semester}`;
      
      if (!acc[key]) {
        acc[key] = {
          academic_year: course.academic_year,
          semester: course.semester,
          courses: [],
        };
      }

      acc[key].courses.push({
        course_code: course.course_code,
        course_name: course.course_name,
        units: course.units,
        grade: course.grade,
      });

      return acc;
    }, {} as Record<string, { academic_year: string; semester: string; courses: Array<{ course_code: string; course_name: string; units: number; grade: string }> }>);

    // Convert to array and sort by academic year and semester
    const completedCoursesBySemester = Object.values(coursesBySemester);

    // Estimate total credits required based on program
    // This is a placeholder - adjust based on your actual degree requirements
    // Typical bachelor's degree requires 120-150 credits
    const totalCreditsRequired = 120;

    return {
      total_credits_earned: totalCreditsEarned,
      total_credits_required: totalCreditsRequired,
      current_year_level: year_level || 1,
      academic_standing: academicStanding,
      completed_courses_by_semester: completedCoursesBySemester,
    };
  }
}
