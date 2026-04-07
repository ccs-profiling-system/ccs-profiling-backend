/**
 * Faculty Validation Schemas
 * Zod schemas for validating faculty input
 * 
 */

import { z } from 'zod';

/**
 * Schema for creating a new faculty
 * Validates all required fields and formats
 * 
 * Note: faculty_id is now optional and system-generated.
 * If provided, it will be validated but clients should omit it.
 */
export const createFacultySchema = z.object({
  faculty_id: z.string().min(1, 'Faculty ID cannot be empty').max(50, 'Faculty ID must be at most 50 characters').optional(),
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must be at most 100 characters'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name must be at most 100 characters'),
  middle_name: z.string().max(100, 'Middle name must be at most 100 characters').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email must be at most 255 characters'),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
  department: z.string().min(1, 'Department is required').max(100, 'Department must be at most 100 characters'),
  position: z.string().max(100, 'Position must be at most 100 characters').optional(),
  specialization: z.string().max(255, 'Specialization must be at most 255 characters').optional(),
  create_user_account: z.boolean().optional(),
});

/**
 * Schema for updating a faculty
 * All fields are optional
 */
export const updateFacultySchema = z.object({
  first_name: z.string().min(1, 'First name cannot be empty').max(100, 'First name must be at most 100 characters').optional(),
  last_name: z.string().min(1, 'Last name cannot be empty').max(100, 'Last name must be at most 100 characters').optional(),
  middle_name: z.string().max(100, 'Middle name must be at most 100 characters').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email must be at most 255 characters').optional(),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
  department: z.string().min(1, 'Department cannot be empty').max(100, 'Department must be at most 100 characters').optional(),
  position: z.string().max(100, 'Position must be at most 100 characters').optional(),
  specialization: z.string().max(255, 'Specialization must be at most 255 characters').optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

/**
 * Schema for faculty ID parameter validation
 */
export const facultyIdParamSchema = z.object({
  id: z.string().uuid('Invalid faculty ID format'),
});

/**
 * Schema for faculty list query parameters
 */
export const facultyListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
