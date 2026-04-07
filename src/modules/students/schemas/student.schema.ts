/**
 * Student Validation Schemas
 * Zod schemas for validating student input
 * 
 */

import { z } from 'zod';

/**
 * Schema for creating a new student
 * Validates all required fields and formats
 * 
 * Note: student_id is now optional and system-generated.
 * If provided, it will be validated but clients should omit it.
 */
export const createStudentSchema = z.object({
  student_id: z.string().min(1, 'Student ID cannot be empty').max(50, 'Student ID must be at most 50 characters').optional(),
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must be at most 100 characters'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name must be at most 100 characters'),
  middle_name: z.string().max(100, 'Middle name must be at most 100 characters').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email must be at most 255 characters'),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  address: z.string().optional(),
  year_level: z.number().int().min(1).max(5).optional(),
  program: z.string().max(100, 'Program must be at most 100 characters').optional(),
  create_user_account: z.boolean().optional(),
});

/**
 * Schema for updating a student
 * All fields are optional
 */
export const updateStudentSchema = z.object({
  first_name: z.string().min(1, 'First name cannot be empty').max(100, 'First name must be at most 100 characters').optional(),
  last_name: z.string().min(1, 'Last name cannot be empty').max(100, 'Last name must be at most 100 characters').optional(),
  middle_name: z.string().max(100, 'Middle name must be at most 100 characters').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email must be at most 255 characters').optional(),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  address: z.string().optional(),
  year_level: z.number().int().min(1).max(5).optional(),
  program: z.string().max(100, 'Program must be at most 100 characters').optional(),
  status: z.enum(['active', 'inactive', 'graduated']).optional(),
});

/**
 * Schema for student ID parameter validation
 */
export const studentIdParamSchema = z.object({
  id: z.string().uuid('Invalid student ID format'),
});

/**
 * Schema for student list query parameters
 */
export const studentListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  program: z.string().optional(),
  year_level: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['active', 'inactive', 'graduated']).optional(),
});
