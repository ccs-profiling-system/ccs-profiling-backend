import { z } from 'zod';
import { researchStatusSchema } from './common.schemas';

/**
 * Create research schema
 * Required: title, description, research_type, start_date
 * Optional: end_date, funding_source, budget, student_researchers
 * Validates: start_date not in past, end_date after start_date
 */
export const createResearchSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    research_type: z.string().min(1, 'Research type is required'),
    start_date: z.string().date('Invalid start date format (expected YYYY-MM-DD)'),
    end_date: z.string().date('Invalid end date format (expected YYYY-MM-DD)').optional(),
    funding_source: z.string().optional(),
    budget: z.number().positive('Budget must be positive').optional(),
    student_researchers: z.array(z.string().uuid('Invalid student ID format')).optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return startDate >= today;
    },
    {
      message: 'Start date cannot be in the past',
      path: ['start_date'],
    }
  )
  .refine(
    (data) => {
      if (!data.end_date) return true;
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate > startDate;
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    }
  );

/**
 * Update research schema
 * Optional: title, description, status, end_date, funding_source, budget, student_researchers
 * Validates: end_date after start_date (if both provided)
 */
export const updateResearchSchema = z
  .object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().min(1, 'Description cannot be empty').optional(),
    status: researchStatusSchema.optional(),
    end_date: z.string().date('Invalid end date format (expected YYYY-MM-DD)').optional(),
    funding_source: z.string().optional(),
    budget: z.number().positive('Budget must be positive').optional(),
    student_researchers: z.array(z.string().uuid('Invalid student ID format')).optional(),
  });

export type CreateResearchInput = z.infer<typeof createResearchSchema>;
export type UpdateResearchInput = z.infer<typeof updateResearchSchema>;
