import { z } from 'zod';

/**
 * Validation schemas for Curriculum Module
 */

export const createCurriculumSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code must be at most 50 characters'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  description: z.string().optional(),
  program: z.string().min(1, 'Program is required').max(100, 'Program must be at most 100 characters'),
  year: z.string().min(1, 'Year is required').max(10, 'Year must be at most 10 characters'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be in YYYY-MM-DD format'),
  status: z.enum(['draft', 'active', 'inactive']).optional().default('draft'),
});

export const updateCurriculumSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  program: z.string().min(1).max(100).optional(),
  year: z.string().min(1).max(10).optional(),
  totalUnits: z.number().int().min(0).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const listCurriculumQuerySchema = z.object({
  search: z.string().optional(),
  program: z.string().optional(),
  year: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
