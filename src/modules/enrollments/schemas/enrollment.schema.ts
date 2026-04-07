/**
 * Enrollment Validation Schemas
 * Zod schemas for validating enrollment input
 * 
 */

import { z } from 'zod';

/**
 * Schema for creating a new enrollment
 * Validates all required fields and formats
 */
export const createEnrollmentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID format'),
  instruction_id: z.string().uuid('Invalid instruction ID format'),
  semester: z.enum(['1st', '2nd', 'summer'], {
    errorMap: () => ({ message: 'Semester must be 1st, 2nd, or summer' }),
  }),
  academic_year: z.string().min(1, 'Academic year is required').max(20, 'Academic year must be at most 20 characters'),
});

/**
 * Schema for updating an enrollment
 * All fields are optional
 */
export const updateEnrollmentSchema = z.object({
  enrollment_status: z.enum(['enrolled', 'dropped', 'completed'], {
    errorMap: () => ({ message: 'Enrollment status must be enrolled, dropped, or completed' }),
  }).optional(),
});

/**
 * Schema for enrollment ID parameter validation
 */
export const enrollmentIdParamSchema = z.object({
  id: z.string().uuid('Invalid enrollment ID format'),
});

/**
 * Schema for student ID parameter validation
 */
export const studentIdParamSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format'),
});

/**
 * Schema for instruction ID parameter validation
 */
export const instructionIdParamSchema = z.object({
  instructionId: z.string().uuid('Invalid instruction ID format'),
});

/**
 * Schema for enrollment list query parameters
 */
export const enrollmentListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  student_id: z.string().uuid('Invalid student ID format').optional(),
  instruction_id: z.string().uuid('Invalid instruction ID format').optional(),
  semester: z.enum(['1st', '2nd', 'summer']).optional(),
  academic_year: z.string().optional(),
  enrollment_status: z.enum(['enrolled', 'dropped', 'completed']).optional(),
});
