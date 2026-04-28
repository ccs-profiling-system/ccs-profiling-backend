/**
 * Report Validation Schemas for Secretary Portal
 * Zod schemas for validating report generation requests
 * 
 */

import { z } from 'zod';
import { reportFormatEnum, approvalStatusEnum } from './common.schemas';

/**
 * Base schema for report generation
 * Contains common fields for all report types
 * 
 */
const baseReportSchema = z.object({
  format: reportFormatEnum,
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
});

/**
 * Schema for generating student reports
 * Includes student-specific filters
 * 
 */
export const generateStudentReportSchema = baseReportSchema.extend({
  year_level: z
    .number()
    .int('Year level must be an integer')
    .min(1, 'Year level must be at least 1')
    .max(6, 'Year level must be at most 6')
    .optional(),
  program: z
    .string()
    .max(200, 'Program must be at most 200 characters')
    .optional(),
  status: z
    .string()
    .max(50, 'Status must be at most 50 characters')
    .optional(),
});

/**
 * Schema for generating faculty reports
 * Includes faculty-specific filters
 * 
 */
export const generateFacultyReportSchema = baseReportSchema.extend({
  department: z
    .string()
    .max(200, 'Department must be at most 200 characters')
    .optional(),
  position: z
    .string()
    .max(200, 'Position must be at most 200 characters')
    .optional(),
  status: z
    .string()
    .max(50, 'Status must be at most 50 characters')
    .optional(),
});

/**
 * Schema for generating event reports
 * Includes event-specific filters
 * 
 */
export const generateEventReportSchema = baseReportSchema.extend({
  event_type: z
    .enum(['seminar', 'workshop', 'defense', 'competition', 'conference', 'meeting', 'other'])
    .optional(),
  status: approvalStatusEnum.optional(),
});

/**
 * Schema for generating research reports
 * Includes research-specific filters
 * 
 */
export const generateResearchReportSchema = baseReportSchema.extend({
  research_type: z
    .enum(['thesis', 'capstone', 'publication', 'grant'])
    .optional(),
  status: approvalStatusEnum.optional(),
});

/**
 * Schema for generating schedule reports
 * Includes schedule-specific filters
 * 
 */
export const generateScheduleReportSchema = baseReportSchema.extend({
  semester: z
    .enum(['1st', '2nd', 'summer'])
    .optional(),
  academic_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Invalid academic year format. Expected YYYY-YYYY')
    .optional(),
  faculty_id: z
    .string()
    .uuid('Faculty ID must be a valid UUID')
    .optional(),
  room: z
    .string()
    .max(100, 'Room must be at most 100 characters')
    .optional(),
});

/**
 * Schema for generating document reports
 * Includes document-specific filters
 * 
 */
export const generateDocumentReportSchema = baseReportSchema.extend({
  category: z
    .enum(['memo', 'policy', 'form', 'report', 'other'])
    .optional(),
});

/**
 * Schema for generating pending changes reports
 * Includes pending changes-specific filters
 * 
 */
export const generatePendingChangesReportSchema = baseReportSchema.extend({
  entity_type: z
    .enum(['student', 'faculty', 'schedule', 'event', 'research'])
    .optional(),
  status: approvalStatusEnum.optional(),
});

/**
 * Generic report generation schema
 * Used when report type is not specified
 * 
 */
export const generateReportSchema = baseReportSchema.extend({
  report_type: z
    .enum(['student', 'faculty', 'event', 'research', 'schedule', 'document', 'pending_changes'])
    .optional(),
  filters: z.record(z.any()).optional(),
});

export type GenerateStudentReportInput = z.infer<typeof generateStudentReportSchema>;
export type GenerateFacultyReportInput = z.infer<typeof generateFacultyReportSchema>;
export type GenerateEventReportInput = z.infer<typeof generateEventReportSchema>;
export type GenerateResearchReportInput = z.infer<typeof generateResearchReportSchema>;
export type GenerateScheduleReportInput = z.infer<typeof generateScheduleReportSchema>;
export type GenerateDocumentReportInput = z.infer<typeof generateDocumentReportSchema>;
export type GeneratePendingChangesReportInput = z.infer<typeof generatePendingChangesReportSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
