/**
 * Analytics Service
 * Computes analytics insights on-demand from existing database records
 * 
 */

import { Database } from '../../../db';
import { academicHistory } from '../../../db/schema/academicHistory';
import { skills } from '../../../db/schema/skills';
import { violations } from '../../../db/schema/violations';
import { research, researchAuthors } from '../../../db/schema/research';
import { enrollments } from '../../../db/schema/enrollments';
import { isNull, count, sql, desc } from 'drizzle-orm';
import {
  GPADistributionDTO,
  SkillDistributionDTO,
  ViolationTrendsDTO,
  ResearchMetricsDTO,
  EnrollmentTrendsDTO,
} from '../types/dtos';

export class AnalyticsService {
  constructor(private db: Database) {}

  /**
   * Get GPA distribution analytics
   * Computes average GPA from Academic_History_Record entries
   */
  async getGPADistribution(): Promise<GPADistributionDTO> {
    // Calculate GPA for each student
    const studentGPAs = await this.db
      .select({
        student_id: academicHistory.student_id,
        gpa: sql<number>`
          SUM(CAST(${academicHistory.grade} AS DECIMAL) * ${academicHistory.credits}) / 
          NULLIF(SUM(${academicHistory.credits}), 0)
        `.as('gpa'),
      })
      .from(academicHistory)
      .groupBy(academicHistory.student_id);

    if (studentGPAs.length === 0) {
      return {
        average_gpa: 0,
        median_gpa: 0,
        highest_gpa: 0,
        lowest_gpa: 0,
        gpa_ranges: [],
        total_students_with_grades: 0,
      };
    }

    // Calculate statistics
    const gpas = studentGPAs.map((s) => s.gpa).filter((gpa) => gpa !== null) as number[];
    const sortedGPAs = [...gpas].sort((a, b) => a - b);

    const averageGPA = gpas.reduce((sum, gpa) => sum + gpa, 0) / gpas.length;
    const medianGPA = sortedGPAs[Math.floor(sortedGPAs.length / 2)];
    const highestGPA = Math.max(...gpas);
    const lowestGPA = Math.min(...gpas);

    // Calculate GPA ranges
    const ranges = [
      { range: '1.00-1.50', min: 1.0, max: 1.5 },
      { range: '1.51-2.00', min: 1.51, max: 2.0 },
      { range: '2.01-2.50', min: 2.01, max: 2.5 },
      { range: '2.51-3.00', min: 2.51, max: 3.0 },
      { range: '3.01-5.00', min: 3.01, max: 5.0 },
    ];

    const gpaRanges = ranges.map((range) => {
      const countInRange = gpas.filter((gpa) => gpa >= range.min && gpa <= range.max).length;
      return {
        range: range.range,
        count: countInRange,
        percentage: (countInRange / gpas.length) * 100,
      };
    });

    return {
      average_gpa: Math.round(averageGPA * 100) / 100,
      median_gpa: Math.round(medianGPA * 100) / 100,
      highest_gpa: Math.round(highestGPA * 100) / 100,
      lowest_gpa: Math.round(lowestGPA * 100) / 100,
      gpa_ranges: gpaRanges,
      total_students_with_grades: gpas.length,
    };
  }

  /**
   * Get skill distribution analytics
   * Calculates skill distribution from Skill_Record entries
   */
  async getSkillDistribution(): Promise<SkillDistributionDTO> {
    // Count total skills
    const totalResult = await this.db
      .select({ count: count() })
      .from(skills);

    const totalSkills = totalResult[0]?.count || 0;

    if (totalSkills === 0) {
      return {
        total_skills: 0,
        unique_skills: 0,
        top_skills: [],
        proficiency_distribution: [],
        students_with_skills: 0,
      };
    }

    // Count unique skills
    const uniqueResult = await this.db
      .select({ count: sql<number>`COUNT(DISTINCT ${skills.skill_name})` })
      .from(skills);

    const uniqueSkills = uniqueResult[0]?.count || 0;

    // Get top skills
    const topSkillsResult = await this.db
      .select({
        skill_name: skills.skill_name,
        count: count(),
      })
      .from(skills)
      .groupBy(skills.skill_name)
      .orderBy(desc(count()))
      .limit(10);

    const topSkills = topSkillsResult.map((skill) => ({
      skill_name: skill.skill_name,
      count: skill.count,
      percentage: (skill.count / totalSkills) * 100,
    }));

    // Get proficiency distribution
    const proficiencyResult = await this.db
      .select({
        proficiency_level: skills.proficiency_level,
        count: count(),
      })
      .from(skills)
      .groupBy(skills.proficiency_level);

    const proficiencyDistribution = proficiencyResult
      .filter((p) => p.proficiency_level !== null)
      .map((p) => ({
        proficiency_level: p.proficiency_level!,
        count: p.count,
        percentage: (p.count / totalSkills) * 100,
      }));

    // Count students with skills
    const studentsWithSkillsResult = await this.db
      .select({ count: sql<number>`COUNT(DISTINCT ${skills.student_id})` })
      .from(skills);

    const studentsWithSkills = studentsWithSkillsResult[0]?.count || 0;

    return {
      total_skills: totalSkills,
      unique_skills: uniqueSkills,
      top_skills: topSkills,
      proficiency_distribution: proficiencyDistribution,
      students_with_skills: studentsWithSkills,
    };
  }

  /**
   * Get violation trends analytics
   * Calculates violation trends from Violation_Record entries
   */
  async getViolationTrends(): Promise<ViolationTrendsDTO> {
    // Count total violations
    const totalResult = await this.db
      .select({ count: count() })
      .from(violations);

    const totalViolations = totalResult[0]?.count || 0;

    if (totalViolations === 0) {
      return {
        total_violations: 0,
        violations_by_type: [],
        violations_by_status: [],
        violations_by_month: [],
        students_with_violations: 0,
        average_violations_per_student: 0,
      };
    }

    // Get violations by type
    const typeResult = await this.db
      .select({
        violation_type: violations.violation_type,
        count: count(),
      })
      .from(violations)
      .groupBy(violations.violation_type)
      .orderBy(desc(count()));

    const violationsByType = typeResult.map((v) => ({
      violation_type: v.violation_type,
      count: v.count,
      percentage: (v.count / totalViolations) * 100,
    }));

    // Get violations by status
    const statusResult = await this.db
      .select({
        status: violations.resolution_status,
        count: count(),
      })
      .from(violations)
      .groupBy(violations.resolution_status);

    const violationsByStatus = statusResult.map((v) => ({
      status: v.status,
      count: v.count,
      percentage: (v.count / totalViolations) * 100,
    }));

    // Get violations by month (last 12 months)
    const monthResult = await this.db
      .select({
        month: sql<string>`TO_CHAR(${violations.violation_date}, 'YYYY-MM')`,
        count: count(),
      })
      .from(violations)
      .groupBy(sql`TO_CHAR(${violations.violation_date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${violations.violation_date}, 'YYYY-MM') DESC`)
      .limit(12);

    const violationsByMonth = monthResult.map((v) => ({
      month: v.month,
      count: v.count,
    }));

    // Count students with violations
    const studentsWithViolationsResult = await this.db
      .select({ count: sql<number>`COUNT(DISTINCT ${violations.student_id})` })
      .from(violations);

    const studentsWithViolations = studentsWithViolationsResult[0]?.count || 0;

    const averageViolationsPerStudent =
      studentsWithViolations > 0 ? totalViolations / studentsWithViolations : 0;

    return {
      total_violations: totalViolations,
      violations_by_type: violationsByType,
      violations_by_status: violationsByStatus,
      violations_by_month: violationsByMonth,
      students_with_violations: studentsWithViolations,
      average_violations_per_student: Math.round(averageViolationsPerStudent * 100) / 100,
    };
  }

  /**
   * Get research output metrics
   * Calculates research output metrics from Research_Record entries
   */
  async getResearchMetrics(): Promise<ResearchMetricsDTO> {
    // Count total research (excluding soft-deleted)
    const totalResult = await this.db
      .select({ count: count() })
      .from(research)
      .where(isNull(research.deleted_at));

    const totalResearch = totalResult[0]?.count || 0;

    if (totalResearch === 0) {
      return {
        total_research: 0,
        research_by_type: [],
        research_by_status: [],
        completed_research: 0,
        ongoing_research: 0,
        published_research: 0,
        total_authors: 0,
        average_authors_per_research: 0,
      };
    }

    // Get research by type
    const typeResult = await this.db
      .select({
        research_type: research.research_type,
        count: count(),
      })
      .from(research)
      .where(isNull(research.deleted_at))
      .groupBy(research.research_type);

    const researchByType = typeResult.map((r) => ({
      research_type: r.research_type,
      count: r.count,
      percentage: (r.count / totalResearch) * 100,
    }));

    // Get research by status
    const statusResult = await this.db
      .select({
        status: research.status,
        count: count(),
      })
      .from(research)
      .where(isNull(research.deleted_at))
      .groupBy(research.status);

    const researchByStatus = statusResult.map((r) => ({
      status: r.status!,
      count: r.count,
      percentage: (r.count / totalResearch) * 100,
    }));

    // Count by specific statuses
    const completedCount = statusResult.find((r) => r.status === 'completed')?.count || 0;
    const ongoingCount = statusResult.find((r) => r.status === 'ongoing')?.count || 0;
    const publishedCount = statusResult.find((r) => r.status === 'published')?.count || 0;

    // Count total authors
    const authorsResult = await this.db
      .select({ count: count() })
      .from(researchAuthors);

    const totalAuthors = authorsResult[0]?.count || 0;

    const averageAuthorsPerResearch = totalResearch > 0 ? totalAuthors / totalResearch : 0;

    return {
      total_research: totalResearch,
      research_by_type: researchByType,
      research_by_status: researchByStatus,
      completed_research: completedCount,
      ongoing_research: ongoingCount,
      published_research: publishedCount,
      total_authors: totalAuthors,
      average_authors_per_research: Math.round(averageAuthorsPerResearch * 100) / 100,
    };
  }

  /**
   * Get enrollment trends analytics
   * Calculates enrollment trends from Enrollment_Record entries
   */
  async getEnrollmentTrends(): Promise<EnrollmentTrendsDTO> {
    // Count total enrollments
    const totalResult = await this.db
      .select({ count: count() })
      .from(enrollments);

    const totalEnrollments = totalResult[0]?.count || 0;

    if (totalEnrollments === 0) {
      return {
        total_enrollments: 0,
        enrollments_by_semester: [],
        enrollments_by_status: [],
        current_semester_enrollments: 0,
        enrollment_growth_rate: 0,
      };
    }

    // Get enrollments by semester
    const semesterResult = await this.db
      .select({
        semester: enrollments.semester,
        academic_year: enrollments.academic_year,
        count: count(),
      })
      .from(enrollments)
      .groupBy(enrollments.semester, enrollments.academic_year)
      .orderBy(enrollments.academic_year, enrollments.semester);

    const enrollmentsBySemester = semesterResult.map((e) => ({
      semester: e.semester,
      academic_year: e.academic_year,
      count: e.count,
    }));

    // Get enrollments by status
    const statusResult = await this.db
      .select({
        status: enrollments.enrollment_status,
        count: count(),
      })
      .from(enrollments)
      .groupBy(enrollments.enrollment_status);

    const enrollmentsByStatus = statusResult.map((e) => ({
      status: e.status,
      count: e.count,
      percentage: (e.count / totalEnrollments) * 100,
    }));

    // Get current semester enrollments (most recent semester)
    const currentSemester =
      enrollmentsBySemester.length > 0
        ? enrollmentsBySemester[enrollmentsBySemester.length - 1]
        : null;
    const currentSemesterEnrollments = currentSemester?.count || 0;

    // Calculate enrollment growth rate (compare current to previous semester)
    let enrollmentGrowthRate = 0;
    if (enrollmentsBySemester.length >= 2) {
      const previousSemester = enrollmentsBySemester[enrollmentsBySemester.length - 2];
      const currentCount = currentSemesterEnrollments;
      const previousCount = previousSemester.count;

      if (previousCount > 0) {
        enrollmentGrowthRate = ((currentCount - previousCount) / previousCount) * 100;
      }
    }

    return {
      total_enrollments: totalEnrollments,
      enrollments_by_semester: enrollmentsBySemester,
      enrollments_by_status: enrollmentsByStatus,
      current_semester_enrollments: currentSemesterEnrollments,
      enrollment_growth_rate: Math.round(enrollmentGrowthRate * 100) / 100,
    };
  }
}
