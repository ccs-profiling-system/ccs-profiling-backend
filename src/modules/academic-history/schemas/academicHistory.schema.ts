/**
 * Academic History Validation Schemas
 * Zod schemas for validating academic history input
 * 
 */

import { z } from 'zod';

/**
 * Schema for creating a new academic history record
 * Validates all required fields and formats
 */
export const createAcademicHistorySchema = z.object({
  student_id: z.string().uuid('Invalid student ID format'),
  subject_code: z.string().min(1, 'Subject code is required').max(50, 'Subject code must be at most 50 characters'),
  subject_name: z.string().min(1, 'Subject name is required').max(200, 'Subject name must be at most 200 characters'),
  grade: z.number().min(0, 'Grade must be at least 0').max(5, 'Grade must be at most 5'),
  semester: z.enum(['1st', '2nd', 'summer'], {
    errorMap: () => ({ message: 'Semester must be 1st, 2nd, or summer' }),
  }),
  academic_year: z.string().min(1, 'Academic year is required').max(20, 'Academic year must be at most 20 characters'),
  credits: z.number().int('Credits must be an integer').min(0, 'Credits must be at least 0').max(10, 'Credits must be at most 10'),
  remarks: z.enum(['passed', 'failed', 'incomplete'], {
    errorMap: () => ({ message: 'Remarks must be passed, failed, or incomplete' }),
  }).optional(),
});

/**
 * Schema for updating an academic history record
 * All fields are optional
 */
export const updateAcademicHistorySchema = z.object({
  subject_code: z.string().min(1, 'Subject code is required').max(50, 'Subject code must be at most 50 characters').optional(),
  subject_name: z.string().min(1, 'Subject name is required').max(200, 'Subject name must be at most 200 characters').optional(),
  grade: z.number().min(0, 'Grade must be at least 0').max(5, 'Grade must be at most 5').optional(),
  semester: z.enum(['1st', '2nd', 'summer'], {
    errorMap: () => ({ message: 'Semester must be 1st, 2nd, or summer' }),
  }).optional(),
  academic_year: z.string().min(1, 'Academic year is required').max(20, 'Academic year must be at most 20 characters').optional(),
  credits: z.number().int('Credits must be an integer').min(0, 'Credits must be at least 0').max(10, 'Credits must be at most 10').optional(),
  remarks: z.enum(['passed', 'failed', 'incomplete'], {
    errorMap: () => ({ message: 'Remarks must be passed, failed, or incomplete' }),
  }).optional(),
});

/**
 * Schema for academic history ID parameter validation
 */
export const academicHistoryIdParamSchema = z.object({
  id: z.string().uuid('Invalid academic history ID format'),
});

/**
 * Schema for student ID parameter validation
 */
export const studentIdParamSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format'),
});

/**
 * Schema for academic history list query parameters
 */
export const academicHistoryListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  student_id: z.string().uuid('Invalid student ID format').optional(),
  semester: z.enum(['1st', '2nd', 'summer']).optional(),
  academic_year: z.string().optional(),
});
