/**
 * Violation Validation Schemas
 * Zod schemas for validating violation input
 * 
 */

import { z } from 'zod';

/**
 * Schema for creating a new violation record
 * Validates all required fields and formats
 */
export const createViolationSchema = z.object({
  student_id: z.string().uuid('Invalid student ID format'),
  violation_type: z.string().min(1, 'Violation type is required').max(100, 'Violation type must be at most 100 characters'),
  description: z.string().min(1, 'Description is required'),
  violation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Violation date must be in YYYY-MM-DD format'),
});

/**
 * Schema for updating a violation record
 * All fields are optional
 */
export const updateViolationSchema = z.object({
  violation_type: z.string().min(1, 'Violation type is required').max(100, 'Violation type must be at most 100 characters').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  violation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Violation date must be in YYYY-MM-DD format').optional(),
  resolution_status: z.enum(['pending', 'resolved', 'dismissed'], {
    errorMap: () => ({ message: 'Resolution status must be pending, resolved, or dismissed' }),
  }).optional(),
  resolution_notes: z.string().optional(),
});

/**
 * Schema for violation ID parameter validation
 */
export const violationIdParamSchema = z.object({
  id: z.string().uuid('Invalid violation ID format'),
});

/**
 * Schema for student ID parameter validation
 */
export const studentIdParamSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format'),
});

/**
 * Schema for violation list query parameters
 */
export const violationListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  student_id: z.string().uuid('Invalid student ID format').optional(),
  resolution_status: z.enum(['pending', 'resolved', 'dismissed']).optional(),
});
