/**
 * Research Validation Schemas
 * Zod schemas for validating research input
 * 
 * Requirements: 21.2
 */

import { z } from 'zod';

/**
 * Schema for creating a new research
 * Validates all required fields and formats
 */
export const createResearchSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be at most 500 characters'),
  abstract: z.string().optional(),
  research_type: z.enum(['thesis', 'capstone', 'publication'], {
    errorMap: () => ({ message: 'Research type must be one of: thesis, capstone, publication' }),
  }),
  status: z.enum(['ongoing', 'completed', 'published'], {
    errorMap: () => ({ message: 'Status must be one of: ongoing, completed, published' }),
  }).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  completion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Completion date must be in YYYY-MM-DD format').optional(),
  publication_url: z.string().url('Publication URL must be a valid URL').max(500, 'Publication URL must be at most 500 characters').optional(),
  author_ids: z.array(z.string().uuid('Invalid author ID format')).min(1, 'At least one author is required'),
  adviser_ids: z.array(z.string().uuid('Invalid adviser ID format')).min(1, 'At least one adviser is required'),
});

/**
 * Schema for updating a research
 * All fields are optional
 */
export const updateResearchSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(500, 'Title must be at most 500 characters').optional(),
  abstract: z.string().optional(),
  research_type: z.enum(['thesis', 'capstone', 'publication'], {
    errorMap: () => ({ message: 'Research type must be one of: thesis, capstone, publication' }),
  }).optional(),
  status: z.enum(['ongoing', 'completed', 'published'], {
    errorMap: () => ({ message: 'Status must be one of: ongoing, completed, published' }),
  }).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  completion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Completion date must be in YYYY-MM-DD format').optional(),
  publication_url: z.string().url('Publication URL must be a valid URL').max(500, 'Publication URL must be at most 500 characters').optional(),
});

/**
 * Schema for research ID parameter validation
 */
export const researchIdParamSchema = z.object({
  id: z.string().uuid('Invalid research ID format'),
});

/**
 * Schema for student ID parameter validation
 */
export const studentIdParamSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format'),
});

/**
 * Schema for faculty ID parameter validation
 */
export const facultyIdParamSchema = z.object({
  facultyId: z.string().uuid('Invalid faculty ID format'),
});

/**
 * Schema for research list query parameters
 */
export const researchListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  research_type: z.enum(['thesis', 'capstone', 'publication']).optional(),
  status: z.enum(['ongoing', 'completed', 'published']).optional(),
});

/**
 * Schema for adding an author
 */
export const addAuthorSchema = z.object({
  student_id: z.string().uuid('Invalid student ID format'),
  author_order: z.number().int().positive('Author order must be a positive integer'),
});

/**
 * Schema for adding an adviser
 */
export const addAdviserSchema = z.object({
  faculty_id: z.string().uuid('Invalid faculty ID format'),
  adviser_role: z.string().max(100, 'Adviser role must be at most 100 characters').optional(),
});
