/**
 * Student Validation Schemas for Secretary Portal
 * Zod schemas for validating student-related input
 * 
 * Requirements: 3.11-3.13
 */

import { z } from 'zod';
import { emailSchema, optionalEmailSchema } from './common.schemas';

/**
 * Schema for creating a new student
 * Validates all required fields for student creation
 * student_id is auto-generated and should NOT be included in the request
 * 
 * Requirements: 3.11, 3.12, 3.13
 */
export const createStudentSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters'),
  middle_name: z
    .string()
    .max(100, 'Middle name must be at most 100 characters')
    .optional(),
  email: emailSchema,
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must not exceed 15 characters')
    .optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  address: z
    .string()
    .max(500, 'Address must be at most 500 characters')
    .optional(),
  year_level: z
    .number()
    .int('Year level must be an integer')
    .min(1, 'Year level must be at least 1')
    .max(6, 'Year level must be at most 6'),
  program: z
    .string()
    .min(1, 'Program is required')
    .max(200, 'Program must be at most 200 characters'),
  status: z
    .string()
    .max(50, 'Status must be at most 50 characters')
    .default('active'),
});

/**
 * Schema for updating an existing student
 * All fields are optional for partial updates
 * 
 * Requirements: 3.11, 3.12, 3.13
 */
export const updateStudentSchema = z.object({
  student_id: z
    .string()
    .min(1, 'Student ID cannot be empty')
    .max(50, 'Student ID must be at most 50 characters')
    .optional(),
  first_name: z
    .string()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be at most 100 characters')
    .optional(),
  last_name: z
    .string()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must be at most 100 characters')
    .optional(),
  middle_name: z
    .string()
    .max(100, 'Middle name must be at most 100 characters')
    .optional(),
  email: optionalEmailSchema,
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must not exceed 15 characters')
    .optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  address: z
    .string()
    .max(500, 'Address must be at most 500 characters')
    .optional(),
  year_level: z
    .number()
    .int('Year level must be an integer')
    .min(1, 'Year level must be at least 1')
    .max(6, 'Year level must be at most 6')
    .optional(),
  program: z
    .string()
    .min(1, 'Program cannot be empty')
    .max(200, 'Program must be at most 200 characters')
    .optional(),
  status: z
    .string()
    .max(50, 'Status must be at most 50 characters')
    .optional(),
});

/**
 * Schema for student filtering query parameters
 * Used for filtering student lists
 */
export const studentFilterSchema = z.object({
  year_level: z.coerce
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
  search: z
    .string()
    .max(200, 'Search query must be at most 200 characters')
    .optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentFilterInput = z.infer<typeof studentFilterSchema>;
