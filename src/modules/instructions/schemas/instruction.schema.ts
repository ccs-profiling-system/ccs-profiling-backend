/**
 * Instruction Validation Schemas
 * Zod schemas for validating instruction input
 * 
 * Requirements: 21.2
 */

import { z } from 'zod';

/**
 * Schema for creating a new instruction
 * Validates all required fields and formats
 */
export const createInstructionSchema = z.object({
  subject_code: z.string().min(1, 'Subject code is required').max(50, 'Subject code must be at most 50 characters'),
  subject_name: z.string().min(1, 'Subject name is required').max(255, 'Subject name must be at most 255 characters'),
  description: z.string().optional(),
  credits: z.number().int('Credits must be an integer').min(0, 'Credits must be non-negative'),
  curriculum_year: z.string().min(1, 'Curriculum year is required').max(20, 'Curriculum year must be at most 20 characters'),
});

/**
 * Schema for updating an instruction
 * All fields are optional
 */
export const updateInstructionSchema = z.object({
  subject_code: z.string().min(1, 'Subject code cannot be empty').max(50, 'Subject code must be at most 50 characters').optional(),
  subject_name: z.string().min(1, 'Subject name cannot be empty').max(255, 'Subject name must be at most 255 characters').optional(),
  description: z.string().optional(),
  credits: z.number().int('Credits must be an integer').min(0, 'Credits must be non-negative').optional(),
  curriculum_year: z.string().min(1, 'Curriculum year cannot be empty').max(20, 'Curriculum year must be at most 20 characters').optional(),
});

/**
 * Schema for instruction ID parameter validation
 */
export const instructionIdParamSchema = z.object({
  id: z.string().uuid('Invalid instruction ID format'),
});

/**
 * Schema for instruction list query parameters
 */
export const instructionListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  subject_code: z.string().optional(),
  curriculum_year: z.string().optional(),
});
