/**
 * Skill Validation Schemas
 * Zod schemas for validating skill input
 * 
 */

import { z } from 'zod';

/**
 * Schema for creating a new skill record
 * Validates all required fields and formats
 */
export const createSkillSchema = z.object({
  student_id: z.string().uuid('Invalid student ID format'),
  skill_name: z.string().min(1, 'Skill name is required').max(200, 'Skill name must be at most 200 characters'),
  category: z.enum(['technical', 'soft', 'sports', 'other'], {
    errorMap: () => ({ message: 'Category must be technical, soft, sports, or other' }),
  }),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert'], {
    errorMap: () => ({ message: 'Proficiency level must be beginner, intermediate, advanced, or expert' }),
  }).optional(),
  years_of_experience: z.number().int('Years of experience must be an integer').min(0, 'Years of experience must be at least 0').max(50, 'Years of experience must be at most 50').optional(),
});

/**
 * Schema for updating a skill record
 * All fields are optional
 */
export const updateSkillSchema = z.object({
  skill_name: z.string().min(1, 'Skill name is required').max(200, 'Skill name must be at most 200 characters').optional(),
  category: z.enum(['technical', 'soft', 'sports', 'other'], {
    errorMap: () => ({ message: 'Category must be technical, soft, sports, or other' }),
  }).optional(),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert'], {
    errorMap: () => ({ message: 'Proficiency level must be beginner, intermediate, advanced, or expert' }),
  }).optional(),
  years_of_experience: z.number().int('Years of experience must be an integer').min(0, 'Years of experience must be at least 0').max(50, 'Years of experience must be at most 50').optional(),
});

/**
 * Schema for skill ID parameter validation
 */
export const skillIdParamSchema = z.object({
  id: z.string().uuid('Invalid skill ID format'),
});

/**
 * Schema for student ID parameter validation
 */
export const studentIdParamSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format'),
});

/**
 * Schema for skill list query parameters
 */
export const skillListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  student_id: z.string().uuid('Invalid student ID format').optional(),
  category: z.enum(['technical', 'soft', 'sports', 'other']).optional(),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
});
