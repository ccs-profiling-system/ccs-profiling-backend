/**
 * Report Validation Schemas for Chair Portal
 * Zod schemas for validating report generation and export parameters
 * 
 */

import { z } from 'zod';

/**
 * Schema for report type validation
 * Defines the supported report types
 */
export const reportTypeSchema = z.enum([
  'student_stats',
  'faculty_stats',
  'schedule_summary',
  'event_summary',
  'research_summary',
], {
  errorMap: () => ({ 
    message: 'Report type must be one of: student_stats, faculty_stats, schedule_summary, event_summary, research_summary' 
  }),
});

/**
 * Schema for report format validation
 * Defines the supported export formats
 */
export const reportFormatSchema = z.enum(['pdf', 'excel'], {
  errorMap: () => ({ message: 'Report format must be either pdf or excel' }),
});

/**
 * Schema for exporting reports
 * Validates report export request parameters
 */
export const exportReportSchema = z.object({
  report_type: reportTypeSchema,
  format: reportFormatSchema,
});
