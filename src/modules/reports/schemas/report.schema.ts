/**
 * Report Validation Schemas
 * Zod schemas for report request validation
 * 
 * Requirements: 21.2
 */

import { z } from 'zod';

/**
 * Student profile report request schema
 */
export const studentProfileReportSchema = z.object({
  student_id: z.string().uuid('Invalid student ID format'),
});

/**
 * Faculty profile report request schema
 */
export const facultyProfileReportSchema = z.object({
  faculty_id: z.string().uuid('Invalid faculty ID format'),
});

/**
 * Enrollment report request schema
 */
export const enrollmentReportSchema = z.object({
  semester: z.enum(['1st', '2nd', 'summer']).optional(),
  academic_year: z.string().optional(),
  program: z.string().optional(),
});

/**
 * Analytics report request schema
 */
export const analyticsReportSchema = z.object({
  report_type: z.enum(['gpa', 'skills', 'violations', 'research', 'enrollments']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});
