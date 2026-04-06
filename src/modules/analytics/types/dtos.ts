/**
 * Analytics Module DTOs
 * Data Transfer Objects for analytics insights
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7
 */

/**
 * GPADistributionDTO - GPA distribution analytics
 * Requirement: 16.3
 */
export interface GPADistributionDTO {
  average_gpa: number;
  median_gpa: number;
  highest_gpa: number;
  lowest_gpa: number;
  gpa_ranges: {
    range: string;
    count: number;
    percentage: number;
  }[];
  total_students_with_grades: number;
}

/**
 * SkillDistributionDTO - Skill distribution analytics
 * Requirement: 16.4
 */
export interface SkillDistributionDTO {
  total_skills: number;
  unique_skills: number;
  top_skills: {
    skill_name: string;
    count: number;
    percentage: number;
  }[];
  proficiency_distribution: {
    proficiency_level: string;
    count: number;
    percentage: number;
  }[];
  students_with_skills: number;
}

/**
 * ViolationTrendsDTO - Violation trends analytics
 * Requirement: 16.5
 */
export interface ViolationTrendsDTO {
  total_violations: number;
  violations_by_type: {
    violation_type: string;
    count: number;
    percentage: number;
  }[];
  violations_by_status: {
    status: string;
    count: number;
    percentage: number;
  }[];
  violations_by_month: {
    month: string;
    count: number;
  }[];
  students_with_violations: number;
  average_violations_per_student: number;
}

/**
 * ResearchMetricsDTO - Research output metrics
 * Requirement: 16.6
 */
export interface ResearchMetricsDTO {
  total_research: number;
  research_by_type: {
    research_type: string;
    count: number;
    percentage: number;
  }[];
  research_by_status: {
    status: string;
    count: number;
    percentage: number;
  }[];
  completed_research: number;
  ongoing_research: number;
  published_research: number;
  total_authors: number;
  average_authors_per_research: number;
}

/**
 * EnrollmentTrendsDTO - Enrollment trends analytics
 * Requirement: 16.1
 */
export interface EnrollmentTrendsDTO {
  total_enrollments: number;
  enrollments_by_semester: {
    semester: string;
    academic_year: string;
    count: number;
  }[];
  enrollments_by_status: {
    status: string;
    count: number;
    percentage: number;
  }[];
  current_semester_enrollments: number;
  enrollment_growth_rate: number;
}
