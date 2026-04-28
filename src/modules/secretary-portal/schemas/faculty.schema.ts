/**
 * Faculty Validation Schemas for Secretary Portal
 * Zod schemas for validating faculty-related input
 * 
 */

import { z } from 'zod';
import { emailSchema, optionalEmailSchema } from './common.schemas';

/**
 * Schema for creating a new faculty member
 * Validates all required fields for faculty creation
 * faculty_id is auto-generated and should NOT be included in the request
 * 
 */
export const createFacultySchema = z.object({
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
  department: z
    .string()
    .min(1, 'Department is required')
    .max(200, 'Department must be at most 200 characters'),
  position: z
    .string()
    .min(1, 'Position is required')
    .max(200, 'Position must be at most 200 characters'),
  specialization: z
    .string()
    .max(500, 'Specialization must be at most 500 characters')
    .optional(),
  hire_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  status: z
    .string()
    .max(50, 'Status must be at most 50 characters')
    .default('active'),
});

/**
 * Schema for updating an existing faculty member
 * All fields are optional for partial updates
 * 
 */
export const updateFacultySchema = z.object({
  faculty_id: z
    .string()
    .min(1, 'Faculty ID cannot be empty')
    .max(50, 'Faculty ID must be at most 50 characters')
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
  department: z
    .string()
    .min(1, 'Department cannot be empty')
    .max(200, 'Department must be at most 200 characters')
    .optional(),
  position: z
    .string()
    .min(1, 'Position cannot be empty')
    .max(200, 'Position must be at most 200 characters')
    .optional(),
  specialization: z
    .string()
    .max(500, 'Specialization must be at most 500 characters')
    .optional(),
  hire_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  status: z
    .string()
    .max(50, 'Status must be at most 50 characters')
    .optional(),
});

/**
 * Schema for faculty filtering query parameters
 * Used for filtering faculty lists
 */
export const facultyFilterSchema = z.object({
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
  search: z
    .string()
    .max(200, 'Search query must be at most 200 characters')
    .optional(),
});

export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
export type FacultyFilterInput = z.infer<typeof facultyFilterSchema>;
