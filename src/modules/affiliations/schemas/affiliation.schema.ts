/**
 * Affiliation Validation Schemas
 * Zod schemas for validating affiliation input
 * 
 * Requirements: 21.2
 */

import { z } from 'zod';

/**
 * Schema for creating a new affiliation record
 * Validates all required fields and formats
 */
export const createAffiliationSchema = z.object({
  student_id: z.string().uuid('Invalid student ID format'),
  organization_name: z.string().min(1, 'Organization name is required').max(200, 'Organization name must be at most 200 characters'),
  role: z.string().max(100, 'Role must be at most 100 characters').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
});

/**
 * Schema for updating an affiliation record
 * All fields are optional
 */
export const updateAffiliationSchema = z.object({
  organization_name: z.string().min(1, 'Organization name is required').max(200, 'Organization name must be at most 200 characters').optional(),
  role: z.string().max(100, 'Role must be at most 100 characters').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  is_active: z.boolean().optional(),
});

/**
 * Schema for affiliation ID parameter validation
 */
export const affiliationIdParamSchema = z.object({
  id: z.string().uuid('Invalid affiliation ID format'),
});

/**
 * Schema for student ID parameter validation
 */
export const studentIdParamSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format'),
});

/**
 * Schema for affiliation list query parameters
 */
export const affiliationListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  student_id: z.string().uuid('Invalid student ID format').optional(),
  is_active: z.string().transform(val => val === 'true').optional(),
});

/**
 * Schema for ending an affiliation
 */
export const endAffiliationSchema = z.object({
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});
